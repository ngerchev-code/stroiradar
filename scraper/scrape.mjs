// СтройРадар — периодично събиране на обяви (пуска се от GitHub Actions на всеки 20 мин).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { searchSource, enrich, classify, RELEVANT, NOISE, priceFromDesc } from './core.mjs';
import { collectNews } from './news.mjs';
import { collectInbox } from './inbox.mjs';

const ROOT = new URL('../docs/data/', import.meta.url);
const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));
const NTFY = process.env.NTFY_TOPIC || config.ntfyTopic || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let old = [];
try { old = JSON.parse(await readFile(new URL('listings.json', ROOT), 'utf8')).items || []; } catch {}
const EXCLX = t => new RegExp(config.excludePattern || '^$', 'i').test(t) || (new RegExp(config.telehandlerPattern || '^$', 'i').test(t) && !/manitou/i.test(t));
old = old.filter(i => RELEVANT.test(i.title + ' ' + (i.desc || '') + ' ' + i.url) && !EXCLX(i.title + ' ' + i.url) && !NOISE.test(i.title));
for (const i of old) { i.type = classify(i.title + ' ' + (i.desc || ''), i.title); const pd = priceFromDesc(i.desc); if (pd) i.price = pd; }
const known = new Map(old.map(i => [i.id, i]));
const firstRun = old.length === 0;

const EXCL0 = new RegExp(config.excludePattern || '^$', 'i');
const TELE = new RegExp(config.telehandlerPattern || '^$', 'i');
// Изключени: лодки, части и консумативи, телескопични товарачи извън Manitou
const EXCL = { test: t => EXCL0.test(t) || (TELE.test(t) && !/manitou/i.test(t)) };
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
        for (const it of items) { it.matched = q; if (!RELEVANT.test(it.title + ' ' + (it.desc || '') + ' ' + it.url) || EXCL.test(it.title + ' ' + it.url) || NOISE.test(it.title)) continue; if (!found.has(it.id)) found.set(it.id, it); }
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
    if (EXCL.test(it.title + ' ' + (it.desc || ''))) found.delete(it.id);
    it.firstSeen = new Date().toISOString();
  }));
}

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

await mkdir(ROOT, { recursive: true });
await writeFile(new URL('listings.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), items }));
try { console.log('Шоурум — нови заявки:', await collectInbox(config.inboxTopic)); } catch (e) { console.log('Шоурум:', e.message); }
try { const news = await collectNews(); if (news.length) await writeFile(new URL('news.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), items: news })); console.log('Новини:', news.length); } catch (e) { console.log('Новини:', e.message); }
await writeFile(new URL('status.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), status }, null, 1));

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
