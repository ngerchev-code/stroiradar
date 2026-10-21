// СтройРадар — периодично събиране на обяви (пуска се от GitHub Actions на всеки 20 мин).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { searchSource, enrich, classify, RELEVANT, NOISE, priceFromDesc, getText, nonMachine, fetchYear, isService } from './core.mjs';
import { updateMarket, findDeals, observe, factsFromHtml } from './deals.mjs';
import { collectNews } from './news.mjs';
import { runTelegram } from './telegram.mjs';
import { collectInbox, collectEval } from './inbox.mjs';

const ROOT = new URL('../docs/data/', import.meta.url);
const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));
const NTFY = process.env.NTFY_TOPIC || config.ntfyTopic || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let old = [];
try { old = JSON.parse(await readFile(new URL('listings.json', ROOT), 'utf8')).items || []; } catch {}
const EXCLX = t => new RegExp(config.excludePattern || '^$', 'i').test(t) || (new RegExp(config.telehandlerPattern || '^$', 'i').test(t) && !/manitou/i.test(t));
const MIN_YEAR = config.minYear || 2008;
const textYear = i => { const m = ((i.title || '') + ' ' + (i.desc || '')).match(/\b(19[89]\d|20[0-2]\d)\b/); return m ? +m[1] : 0; };
const tooOld = i => { const y = +i.year || +i.yr || textYear(i); return y > 0 && y < MIN_YEAR; };
old = old.filter(i => RELEVANT.test(i.title + ' ' + (i.desc || '') + ' ' + i.url) && !EXCLX(i.title + ' ' + i.url) && !NOISE.test(i.title) && !nonMachine(i.title) && !isService(i.title) && !tooOld(i));
for (const i of old) { i.type = classify(i.title + ' ' + (i.desc || ''), i.title); const pd = priceFromDesc(i.desc); if (pd) i.price = pd; }
for (const i of old) if (/^\d\s\d{2}\s\d{3}\b/.test(i.price || '')) i.price = i.price.replace(/^\d\s/, '');
const known = new Map(old.map(i => [i.id, i]));
const firstRun = old.length === 0;

const EXCL0 = new RegExp(config.excludePattern || '^$', 'i');
const TELE = new RegExp(config.telehandlerPattern || '^$', 'i');
// Изключени: лодки, части и консумативи, телескопични товарачи извън Manitou
const EXCL = { test: t => EXCL0.test(t) || (TELE.test(t) && !/manitou/i.test(t)) };
let rates = { TRY: 0, RON: 0, PLN: 0, RSD: 0 };
try { const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=TRY,RON,PLN'); const j = await r.json(); for (const k of ['TRY', 'RON', 'PLN']) if (j.rates?.[k]) rates[k] = j.rates[k]; } catch {}
try { const r = await fetch('https://open.er-api.com/v6/latest/EUR'); const j = await r.json(); for (const k of Object.keys(rates)) if (!rates[k] && j.rates?.[k]) rates[k] = j.rates[k]; } catch {}
console.log('Курсове EUR:', JSON.stringify(rates));
const found = new Map();
// Диагностика: записва първата страница от всеки сайт
if (process.env.DEBUG_HTML) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync(new URL('../debug/', import.meta.url), { recursive: true });
  const seen = new Set();
  globalThis.__debugDump = (key, u, html) => { if (seen.has(key)) return; seen.add(key); writeFileSync(new URL(`../debug/${key}.html`, import.meta.url), `<!-- ${u} -->\n` + html.slice(0, 400000)); };
}
const status = {};

async function runSource(key, src, terms) {
  let ok = 0, err = 0, last = '';
  const queue = terms.length ? [...terms] : [''];
  const worker = async () => {
    while (queue.length) {
      const q = queue.shift();
      try {
        const items = await searchSource(key, src, q, { enrichDetails: false });
        for (const it of items) { it.matched = q; if (!RELEVANT.test(it.title + ' ' + (it.desc || '') + ' ' + it.url + ' ' + (it.hint || '')) || EXCL.test(it.title + ' ' + it.url) || NOISE.test(it.title) || nonMachine(it.title) || isService(it.title)) continue; if (!found.has(it.id)) found.set(it.id, it); }
        ok++;
      } catch (e) { err++; last = e.message; }
      await sleep(700);
    }
  };
  await Promise.all([worker(), worker()]);
  status[key] = { name: src.name, ok, err, lastError: last, at: new Date().toISOString() };
  console.log(`${src.name}: ${ok} ок, ${err} грешки ${last}`);
}

const jobs = Object.entries(config.sources).filter(([, s]) => s.enabled).map(([k, s]) => {
  const terms = k === 'mobilebg' ? [] : (s.olx && s.foreign) ? config.olxForeignTerms : (s.foreign ? config.foreignTerms : config.searchTerms);
  return runSource(k, s, terms);
});
await Promise.all(jobs);

// Нови обяви → детайли (снимка, описание, цена)
const fresh = [...found.values()].filter(i => !known.has(i.id));
console.log(`Намерени: ${found.size}, нови: ${fresh.length}`);
for (let i = 0; i < fresh.length; i += 6) {
  await Promise.all(fresh.slice(i, i + 6).map(async it => {
    if (it.source !== 'olx' && !it.desc) await enrich(it);
    it.type = classify(it.title + ' ' + it.desc, it.title);
    if (EXCL.test(it.title + ' ' + (it.desc || '')) || nonMachine(it.title) || tooOld(it)) found.delete(it.id);
    it.firstSeen = new Date().toISOString();
  }));
}

// Година за старите обяви без година (постепенно — до 350 на пускане)
const noYear = [...known.values()].filter(i => i.year === undefined && !i.yr && i.type !== 'wanted' && !textYear(i)).slice(0, 350);
for (let i = 0; i < noYear.length; i += 6) await Promise.all(noYear.slice(i, i + 6).map(fetchYear));
for (const it of noYear) if (tooOld(it)) known.delete(it.id);
console.log(`Година: проверени ${noYear.length}, намерена при ${noYear.filter(i => i.year).length}`);

// Само обяви с истинска снимка (по-малко данни, по-бързо приложение)
const BAD_PHOTO = /noimage|no-image|no_photo|nophoto|placeholder|default[-_]?(img|image)|logo|blank\.(gif|png)|spacer|data:image|1x1/i;
const okPhoto = it => !!it.photo && /^https?:\/\//.test(it.photo) && !BAD_PHOTO.test(it.photo);
for (const m of [found, known]) for (const it of m.values()) if (it.photo?.startsWith('//')) it.photo = 'https:' + it.photo;
for (const [id, it] of found) if (!okPhoto(it) && !known.get(id)?.photo) found.delete(id);
for (const [id, it] of known) if (!okPhoto(it)) known.delete(id);

// Сливане и почистване на стари
const cutoff = Date.now() - config.maxAgeDays * 864e5;
const merged = new Map(known);
for (const it of found.values()) {
  const prev = known.get(it.id);
  merged.set(it.id, prev ? { ...prev, price: it.price || prev.price, lastSeen: new Date().toISOString() } : { ...it, lastSeen: new Date().toISOString() });
}
const items = [...merged.values()]
  .filter(i => new Date(i.firstSeen || i.date).getTime() > cutoff)
  .sort((a, b) => new Date(b.firstSeen || b.date) - new Date(a.firstSeen || a.date))
  .slice(0, config.maxListings);

// ---------- Ловец на сделки: обяви под пазарната цена ----------
const DC = config.deals || {};
let market = { byKey: {}, notified: [] }, dealsFirst = false;
try { market = JSON.parse(await readFile(new URL('market.json', ROOT), 'utf8')); } catch { dealsFirst = true; }
let turkey = [];
try { turkey = JSON.parse(await readFile(new URL('turkey.json', ROOT), 'utf8')).items || []; } catch {}
const pool = [...items, ...turkey.filter(t => !merged.has(t.id))];
market = updateMarket(market, pool, rates);
// Година и моточасове от детайлната страница: първо кандидатите за сделка, после машините от същите модели
{
  const pre = findDeals(pool, market, rates, { ...DC, minDiscount: (DC.minDiscount ?? 0.15) - 0.05 });
  const keys = new Set(pre.map(d => d.brand + '|' + d.model));
  const queue = [
    ...pre.map(d => pool.find(i => i.id === d.id)),
    ...pool.filter(i => { const o = observe(i, rates); return o && keys.has(o.key); }),
    ...pool.filter(i => { const o = observe(i, rates); return o && (market.byKey[o.key] || []).length >= 3; })
  ].filter((i, k, a) => i && !i.factsAt && !i.yr && a.indexOf(i) === k);
  let fetched = 0;
  for (const it of queue.slice(0, DC.detailFetchesPerRun ?? 40)) {
    try { const f = factsFromHtml(await getText(it.url, 12000)); if (f.yr) it.yr = f.yr; if (f.mh) it.mh = f.mh; } catch {}
    it.factsAt = new Date().toISOString(); fetched++;
    await sleep(500);
  }
  if (fetched) market = updateMarket(market, pool, rates);
  console.log('Сделки — прочетени детайли:', fetched);
}
const deals = findDeals(pool, market, rates, DC);
const notifiedDeals = new Set(market.notified || []);
const newDeals = deals.filter(d => !d.suspicious && d.conf !== 'ниска' && !notifiedDeals.has(d.id));
market.notified = [...notifiedDeals, ...newDeals.map(d => d.id)].slice(-3000);
console.log(`Сделки: ${deals.length}, нови за известие: ${newDeals.length}`);

await mkdir(ROOT, { recursive: true });
await writeFile(new URL('listings.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), rates, items }));
try { console.log('Шоурум — нови заявки:', await collectInbox(config.inboxTopic)); } catch (e) { console.log('Шоурум:', e.message); }
try { console.log('Становища — нови файлове:', await collectEval(config.evalTopic)); } catch (e) { console.log('Становища:', e.message); }
try { console.log('Публикуване — нови файлове:', await collectEval(config.publishTopic, 'publish')); } catch (e) { console.log('Публикуване:', e.message); }
try { const news = await collectNews(); if (news.length) await writeFile(new URL('news.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), items: news })); console.log('Новини:', news.length); } catch (e) { console.log('Новини:', e.message); }
await writeFile(new URL('market.json', ROOT), JSON.stringify(market));
await writeFile(new URL('deals.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), settings: { minDiscount: DC.minDiscount ?? 0.15, transport: DC.transport || { BG: 500, foreign: 2500 }, brokerFee: DC.brokerFee ?? 0.03 }, items: deals.slice(0, 200) }));
// Известие за всяка нова сделка (не при първото пускане — тогава само се трупа история)
if (NTFY && !dealsFirst) {
  const eur = n => '€ ' + Math.round(n).toLocaleString('de-DE').replace(/\./g, ' ');
  for (const d of newDeals.slice(0, DC.maxPushPerRun ?? 8)) {
    const src = config.sources[d.source] || {};
    const facts = [d.year && `${d.year} г.`, d.hours && `${d.hours.toLocaleString('de-DE').replace(/\./g, ' ')} мч`].filter(Boolean).join(' · ');
    try {
      await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        topic: NTFY, priority: d.discount >= 25 ? 5 : 4, tags: ['moneybag', 'construction'], click: d.url,
        title: `💰 СДЕЛКА −${d.discount}% · ${d.brand} ${d.model}`,
        message: `${d.title}${facts ? '\n' + facts : ''}\n💶 ${eur(d.price)} (пазар ${eur(d.market)}, ${d.n} обяви)\n📈 Потенциал ${eur(d.profit)} · комисионна ~${eur(d.commission)}\n${src.flag || ''} ${src.name || d.source}${d.location ? ' · ' + d.location : ''}`
      }) });
    } catch {}
    await sleep(400);
  }
}
await writeFile(new URL('status.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), status }, null, 1));

// Telegram бот (ако е зададен TELEGRAM_BOT_TOKEN)
try {
  const ALARM_T = new RegExp(config.alarmPattern || 'hidromek|хидромек', 'i');
  const live = new Set(items.map(i => i.id));
  await runTelegram({ token: process.env.TELEGRAM_BOT_TOKEN, ownerEnv: process.env.TELEGRAM_CHAT_ID || config.telegramChatId, config, items, deals, newDeals, dealsFirst,
    alarmItems: firstRun ? [] : fresh.filter(it => live.has(it.id) && ALARM_T.test(it.title + ' ' + (it.desc || ''))) });
} catch (e) { console.log('Telegram:', e.message); }

// Push известия (ntfy) — само за нови, не при първо пускане
if (NTFY && !firstRun && fresh.length) {
  const icon = { wanted: '🔴 ТЪРСИ', sale: '🟢 ПРОДАВА', service: '🛠 СЕРВИЗ', rent: '🔵 НАЕМ' };
  const ALARM = new RegExp(config.alarmPattern || 'hidromek|хидромек', 'i');
  const send = async (title, body, click, tags, priority = 4) => {
    try {
      await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: NTFY, title, message: body, click, tags: tags.split(','), priority }) });
    } catch {}
  };
  // 1) Аларма: всяка нова обява за Hidromek — спешен приоритет (звук и изскачащо известие)
  const alarm = fresh.filter(it => ALARM.test(it.title + ' ' + (it.desc || '')));
  for (const it of alarm) {
    const src = config.sources[it.source] || {};
    await send(`🚨 HIDROMEK · ${icon[it.type] || 'НОВА ОБЯВА'}`,
      `${it.title}${it.price ? '\n💰 ' + it.price : ''}${it.location ? '\n📍 ' + it.location : ''}\n${src.flag || ''} ${src.name || ''}`,
      it.url, 'rotating_light,construction', 5);
    await sleep(400);
  }
  // 2) Останалите нови обяви — обичаен приоритет
  const rest = fresh.filter(it => !alarm.includes(it));
  const top = rest.slice(0, 8);
  for (const it of top) {
    const src = config.sources[it.source] || {};
    await send(`${icon[it.type] || '🔔'} · ${src.flag || ''} ${src.name || ''}`,
      `${it.title}${it.price ? '\n💰 ' + it.price : ''}${it.location ? '\n📍 ' + it.location : ''}`,
      it.url, it.type === 'wanted' ? 'rotating_light,construction' : 'bell,construction');
    await sleep(400);
  }
  if (rest.length > top.length) await send(`🔔 Още ${rest.length - top.length} нови обяви`, 'Отвори ECOBenchmark, за да ги видиш.', config.appUrl || 'https://ngerchev-code.github.io/stroiradar/', 'bell');
}
