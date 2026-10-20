// ECOBenchmark асистент — Telegram бот с Claude (Cloudflare Worker, безплатен план).
//
// Как работи (4-те части на всеки бот):
//   Спусък — Telegram праща всяко ново съобщение към POST /telegram (webhook).
//   Мозък  — Claude чете разговора и решава дали да отговори или да ползва инструмент.
//   Ръце   — инструментите отдолу: търсене на живо, сделки, пазарни цени, входяща кутия…
//   Памет  — разговорът се пази в Cloudflare KV (ключ chat:<id>).
import Anthropic from '@anthropic-ai/sdk';
import { searchAll } from '../scraper/core.mjs';
import config from '../scraper/config.json';

const DATA = 'https://ngerchev-code.github.io/stroiradar/data/';
const RAW = 'https://raw.githubusercontent.com/ngerchev-code/stroiradar/main/';
const FRESH_AFTER = 6 * 3600e3;   // след 6 часа тишина започваме нов разговор
const MAX_MESSAGES = 60;          // твърде дълъг разговор → започваме нов
const MAX_STEPS = 8;              // най-много толкова кръга „инструмент → отговор“

const SYSTEM = `Ти си административният асистент на Николай в ECOBenchmark — платформа за строителна техника, обяви и пазарни цени в България и Европа.
Отговаряй на български, кратко и по същество, като на колега в чат. Без markdown таблици — Telegram ги показва зле.
Имаш инструменти към данните на ECOBenchmark. Ползвай ги, вместо да гадаеш цени или обяви; когато даваш обява, дай и линка.
Когато Николай поиска писмо, отговор до клиент или оферта — напиши чернова, която той сам ще изпрати. Никога не обещавай цена, срок или сделка от негово име без да е потвърдил.
Ако данните липсват или инструмент върне грешка, кажи го направо.`;

// ── Инструменти: описанието казва на Claude КОГА да ги ползва ──────────────
const TOOLS = [
  {
    name: 'search_live',
    description: 'Търси обяви на живо в сайтовете (Bazar.bg, Mobile.bg, Kleinanzeigen, Machineseeker…). Ползвай за конкретна машина, марка или модел.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Търсене, напр. "hidromek 102b" или "jcb 3cx"' },
        scope: { type: 'string', enum: ['bg', 'foreign', 'all'], description: 'Само български сайтове, само чужди, или всички' }
      },
      required: ['query'],
      additionalProperties: false
    }
  },
  {
    name: 'get_deals',
    description: 'Текущите изгодни сделки — обяви значително под пазарната цена, с изчислена печалба след транспорт и комисиона.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'get_market_price',
    description: 'Пазарна цена (медиана) за марка и модел от събраните обяви, с брой обяви, години и моточасове.',
    input_schema: {
      type: 'object',
      properties: { model: { type: 'string', description: 'Марка и/или модел, напр. "Takeuchi TB290" или "JCB 3CX"' } },
      required: ['model'],
      additionalProperties: false
    }
  },
  {
    name: 'get_inbox',
    description: 'Входящата кутия: запитвания и материали, изпратени от формата в приложението ECOBenchmark.',
    input_schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['pending', 'all'], description: 'Само чакащи (по подразбиране) или всички' } },
      additionalProperties: false
    }
  },
  {
    name: 'get_news',
    description: 'Последните новини от бранша: инфраструктурни проекти, машини, енергия, икономика.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['infra', 'machines', 'energy', 'economy', 'industry', 'knowhow'] },
        limit: { type: 'integer', description: 'Колко новини (до 20)' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'get_status',
    description: 'Дали събирането на обяви работи: кога за последно е минал всеки сайт и има ли грешки.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false }
  }
];

async function getJSON(url) {
  const r = await fetch(url, { cf: { cacheTtl: 300 } });
  if (!r.ok) throw new Error(`HTTP ${r.status} за ${url}`);
  return r.json();
}

const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

// Ръцете на бота: тук се изпълнява това, което Claude е поискал.
async function runTool(name, input) {
  switch (name) {
    case 'search_live': {
      const scope = input.scope || 'all';
      const only = Object.keys(config.sources).filter(k =>
        scope === 'all' || (scope === 'foreign' ? config.sources[k].foreign : !config.sources[k].foreign));
      const { items, status } = await searchAll(config, input.query.slice(0, 80), { only, enrichDetails: false });
      return {
        found: items.length,
        items: items.slice(0, 15).map(i => ({ title: i.title, price: i.price, location: i.location, source: i.source, url: i.url })),
        errors: Object.entries(status).filter(([, s]) => !s.ok).map(([k, s]) => `${k}: ${s.error}`)
      };
    }
    case 'get_deals': {
      const d = await getJSON(DATA + 'deals.json');
      return {
        updated: d.updated,
        items: d.items.map(i => ({
          title: i.title, brand: i.brand, model: i.model, year: i.year, hours: i.hours, price: i.price,
          market: i.market, discount: i.discount + '%', profit: i.profit, confidence: i.conf, suspicious: i.suspicious, url: i.url
        }))
      };
    }
    case 'get_market_price': {
      const m = await getJSON(DATA + 'market.json');
      const words = input.model.toLowerCase().split(/\s+/).filter(Boolean);
      const keys = Object.keys(m.byKey).filter(k => words.every(w => k.toLowerCase().includes(w)));
      if (!keys.length) return { found: false, hint: 'Няма събрани обяви за този модел. Опитай search_live.' };
      return {
        found: true,
        models: keys.slice(0, 5).map(k => {
          const rows = m.byKey[k];
          const bg = rows.filter(r => !r.f).map(r => r.p), foreign = rows.filter(r => r.f).map(r => r.p);
          return {
            model: k.replace('|', ' '), listings: rows.length,
            medianAll: median(rows.map(r => r.p)), medianBG: median(bg), medianForeign: median(foreign),
            years: rows.map(r => r.y).filter(Boolean).sort().join(', ') || 'неизвестни'
          };
        })
      };
    }
    case 'get_inbox': {
      const box = await getJSON(RAW + 'inbox/submissions.json');
      const items = input.status === 'all' ? box.items : box.items.filter(i => i.status === 'pending');
      return { count: items.length, items: items.slice(-20) };
    }
    case 'get_news': {
      const n = await getJSON(DATA + 'news.json');
      const items = n.items.filter(i => !input.category || i.cat === input.category);
      return items.slice(0, Math.min(input.limit || 8, 20)).map(i => ({ title: i.title, source: i.source, date: i.date, url: i.url }));
    }
    case 'get_status':
      return (await getJSON(DATA + 'status.json')).status;
    default:
      throw new Error('Непознат инструмент: ' + name);
  }
}

// ── Мозъкът: цикълът „Claude мисли → ползва инструмент → мисли пак“ ────────
async function think(env, messages) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low' },        // чат → ниско усилие: по-бързо и по-евтино
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',                    // ако моделът откаже, друг модел поема
      cache_control: { type: 'ephemeral' },    // кешира повтарящото се начало — по-евтино
      system: SYSTEM,
      tools: TOOLS,
      messages
    });
    // Пазим ЦЕЛИЯ отговор (не само текста) — така Claude помни какво е мислил и ползвал.
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') {
      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      if (response.stop_reason === 'refusal') return text || 'Не мога да помогна с това.';
      return text || '(няма отговор)';
    }

    const results = await Promise.all(response.content.filter(b => b.type === 'tool_use').map(async b => {
      try {
        return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(await runTool(b.name, b.input)) };
      } catch (e) {
        return { type: 'tool_result', tool_use_id: b.id, content: String(e.message || e), is_error: true };
      }
    }));
    // Всички резултати — в едно съобщение.
    messages.push({ role: 'user', content: results });
  }
  throw new Error('Твърде много стъпки');
}

// ── Telegram ───────────────────────────────────────────────────────────────
async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return r.json();
}

async function say(env, chat_id, text) {
  for (let i = 0; i < text.length; i += 4000)                       // лимит на Telegram: 4096 знака
    await tg(env, 'sendMessage', { chat_id, text: text.slice(i, i + 4000), disable_web_page_preview: true });
}

async function onMessage(env, msg) {
  const chat = msg.chat.id, text = (msg.text || '').trim();
  if (!text) return say(env, chat, 'Засега разбирам само текст.');

  // Само собственикът говори с бота — иначе всеки би харчил от вашия API ключ.
  if (String(chat) !== String(env.OWNER_CHAT_ID))
    return say(env, chat, `Това е частен бот. Вашият chat id е ${chat} — ако сте собственикът, запишете го в OWNER_CHAT_ID.`);

  const key = 'chat:' + chat;
  if (text === '/start' || text === '/new') {
    await env.MEMORY.delete(key);
    return say(env, chat, 'Нов разговор. Питайте ме за обяви, цени, сделки, входящата кутия или ми дайте да напиша писмо.');
  }

  // Паметта: продължаваме разговора, ако е скорошен; иначе започваме на чисто.
  let saved = await env.MEMORY.get(key, 'json');
  if (!saved || Date.now() - saved.at > FRESH_AFTER || saved.messages.length > MAX_MESSAGES) saved = { messages: [] };
  const messages = [...saved.messages, { role: 'user', content: text }];

  await tg(env, 'sendChatAction', { chat_id: chat, action: 'typing' });
  try {
    const reply = await think(env, messages);
    await env.MEMORY.put(key, JSON.stringify({ at: Date.now(), messages }), { expirationTtl: 7 * 86400 });
    await say(env, chat, reply);
  } catch (e) {
    await say(env, chat, 'Грешка: ' + (e.message || e) + '\nОпитайте пак или напишете /new.');
  }
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method !== 'POST' || u.pathname !== '/telegram') return Response.json({ ok: true, app: 'ECOBenchmark bot' });
    // Тайната дума доказва, че заявката идва от Telegram, а не от някой друг.
    if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });

    const update = await req.json();
    // Telegram повтаря съобщение, ако отговорим бавно — затова помним кои вече сме видели.
    const seen = 'update:' + update.update_id;
    if (await env.MEMORY.get(seen)) return new Response('ok');
    await env.MEMORY.put(seen, '1', { expirationTtl: 3600 });

    if (update.message) await onMessage(env, update.message);
    return new Response('ok');
  }
};
