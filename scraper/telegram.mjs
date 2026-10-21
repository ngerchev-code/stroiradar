// ECOBenchmark — Telegram бот: сделки под пазара, аларма за Hidromek и команди.
// Работи при всяко пускане на събирането (на 20 мин). Командите получават отговор при следващото пускане.
// Достъп има само собственикът: TELEGRAM_CHAT_ID (таен ключ) или първият, който напише /start.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const API = t => `https://api.telegram.org/bot${t}`;
const STATE = new URL('../inbox/telegram.json', import.meta.url);
const eur = n => n == null ? '—' : '€ ' + Math.round(n).toLocaleString('de-DE').replace(/\./g, ' ');
const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(token, method, body) {
  try {
    const r = await fetch(`${API(token)}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!j.ok) console.log('Telegram', method, j.description);
    return j;
  } catch (e) { console.log('Telegram', method, e.message); return {}; }
}
async function send(token, chat, text, photo, url) {
  const reply_markup = url ? { inline_keyboard: [[{ text: 'Отвори обявата ›', url }]] } : undefined;
  if (photo && /^https?:\/\//.test(photo)) {
    const j = await call(token, 'sendPhoto', { chat_id: chat, photo, caption: text.slice(0, 1020), parse_mode: 'HTML', reply_markup });
    if (j.ok) return;
  }
  await call(token, 'sendMessage', { chat_id: chat, text: text.slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true, reply_markup });
}

const dealText = (d, src) => {
  const facts = [d.year && `${d.year} г.`, d.hours && `${d.hours.toLocaleString('de-DE').replace(/\./g, ' ')} мч`].filter(Boolean).join(' · ');
  return `💰 <b>СДЕЛКА −${d.discount}%</b> · ${esc(d.brand)} ${esc(d.model)}\n${esc(d.title)}${facts ? '\n' + facts : ''}\n💶 <b>${eur(d.price)}</b> (пазар ${eur(d.market)}, ${d.n} обяви)\n📈 Потенциал ${eur(d.profit)}\n${src.flag || ''} ${esc(src.name || d.source)}${d.location ? ' · ' + esc(d.location) : ''}`;
};
const itemText = (it, src, head) => `${head}\n<b>${esc(it.title)}</b>${it.price ? '\n💰 ' + esc(it.price) : ''}${it.location ? '\n📍 ' + esc(it.location) : ''}\n${src.flag || ''} ${esc(src.name || it.source)}`;

// Прост разбор на търсене: думи + „до 40000“ / „над 20000“
function searchItems(items, q) {
  let max = null, min = null;
  q = q.replace(/(?:до|под|<)\s*(\d[\d\s.]*)\s*(k|к)?/i, (m, a, k) => { max = +a.replace(/\D/g, '') * (k ? 1000 : 1); return ' '; })
       .replace(/(?:над|от|>)\s*(\d[\d\s.]*)\s*(k|к)?/i, (m, a, k) => { min = +a.replace(/\D/g, '') * (k ? 1000 : 1); return ' '; });
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const num = p => { const m = /(\d[\d\s.,]*)/.exec(String(p || '')); if (!m) return null; const n = +m[1].replace(/[\s.]/g, '').replace(',', '.'); return /лв|bgn/i.test(p) ? n / 1.95583 : /€|eur/i.test(p) ? n : null; };
  return items.filter(it => {
    const t = (it.title + ' ' + (it.desc || '')).toLowerCase();
    if (!words.every(w => t.includes(w))) return false;
    const p = num(it.price);
    return (!max || (p && p <= max)) && (!min || (p && p >= min));
  });
}

export async function runTelegram({ token, ownerEnv, config, items, deals, newDeals, alarmItems, dealsFirst }) {
  if (!token) return;
  let st = { offset: 0, owner: null, sentDeals: [], sentAlarm: [] };
  try { st = { ...st, ...JSON.parse(await readFile(STATE, 'utf8')) }; } catch {}
  const owner = ownerEnv || st.owner;
  const SRC = config.sources || {};

  // 1) Входящи съобщения и команди
  const up = await call(token, 'getUpdates', { offset: st.offset || 0, timeout: 0, allowed_updates: ['message'] });
  for (const u of up.result || []) {
    st.offset = u.update_id + 1;
    const m = u.message; if (!m?.text) continue;
    const chat = String(m.chat.id), text = m.text.trim();
    if (!owner && !st.owner && /^\/start/.test(text)) { st.owner = chat; }
    if (chat !== String(ownerEnv || st.owner)) { await send(token, chat, 'Този бот е частен.'); continue; }
    const [cmd, ...rest] = text.split(/\s+/); const arg = rest.join(' ');
    if (/^\/(start|help)/.test(cmd)) {
      await send(token, chat, '<b>ECOBenchmark бот</b>\n\nТук идват автоматично:\n💰 сделки под пазарната цена\n🚨 всяка нова обява за Hidromek\n\nКоманди (отговор до 20 мин):\n/deals — най-добрите сделки сега\n/hidromek — последните обяви Hidromek\n/search jcb 3cx до 45000 — търсене\n/stats — обобщение\n\nПриложението: ' + (config.appUrl || ''));
    } else if (/^\/deals/.test(cmd)) {
      const top = deals.filter(d => !d.suspicious).slice(0, 5);
      if (!top.length) await send(token, chat, 'В момента няма сделки под пазара.');
      for (const d of top) { await send(token, chat, dealText(d, SRC[d.source] || {}), d.photo, d.url); await sleep(300); }
    } else if (/^\/hidromek/.test(cmd)) {
      const h = items.filter(i => /hidromek|хидромек|\bhmk ?\d/i.test(i.title)).slice(0, 5);
      if (!h.length) await send(token, chat, 'Няма актуални обяви за Hidromek.');
      for (const it of h) { await send(token, chat, itemText(it, SRC[it.source] || {}, '🟢 Hidromek'), it.photo, it.url); await sleep(300); }
    } else if (/^\/search/.test(cmd)) {
      if (!arg) { await send(token, chat, 'Напиши какво търсиш, напр. /search jcb 3cx до 45000'); continue; }
      const r = searchItems(items, arg);
      await send(token, chat, `🔎 „${esc(arg)}“ — ${r.length} обяви${r.length > 5 ? ' (първите 5)' : ''}`);
      for (const it of r.slice(0, 5)) { await send(token, chat, itemText(it, SRC[it.source] || {}, '🔎'), it.photo, it.url); await sleep(300); }
    } else if (/^\/stats/.test(cmd)) {
      const day = Date.now() - 864e5;
      await send(token, chat, `📊 <b>ECOBenchmark</b>\nОбяви: ${items.length}\nНови за 24 ч: ${items.filter(i => new Date(i.firstSeen || i.date) > day).length}\nТърсят техника: ${items.filter(i => i.type === 'wanted').length}\nСделки под пазара: ${deals.filter(d => !d.suspicious).length}`);
    } else {
      await send(token, chat, 'Не разбрах. Напиши /help');
    }
  }

  // 2) Автоматични известия към собственика
  const to = ownerEnv || st.owner;
  if (to && !dealsFirst) {
    const sent = new Set(st.sentDeals);
    for (const d of newDeals.filter(d => !sent.has(d.id)).slice(0, config.deals?.maxPushPerRun ?? 8)) {
      await send(token, to, dealText(d, SRC[d.source] || {}), d.photo, d.url); sent.add(d.id); await sleep(400);
    }
    st.sentDeals = [...sent].slice(-3000);
    const sa = new Set(st.sentAlarm);
    for (const it of alarmItems.filter(i => !sa.has(i.id)).slice(0, 10)) {
      await send(token, to, itemText(it, SRC[it.source] || {}, '🚨 <b>HIDROMEK</b> · нова обява'), it.photo, it.url); sa.add(it.id); await sleep(400);
    }
    st.sentAlarm = [...sa].slice(-3000);
  }
  await mkdir(new URL('../inbox/', import.meta.url), { recursive: true });
  await writeFile(STATE, JSON.stringify(st, null, 1));
  console.log('Telegram: собственик', to ? 'зададен' : 'няма (напиши /start на бота)');
}
