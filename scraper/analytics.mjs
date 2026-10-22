// ECOBenchmark — пазарен анализ: потенциал на всяка обява, история (колко дни стои на пазара),
// дневни и седмични показатели по категории, седмичен отчет.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
// Историята се пази извън основния клон (виж workflow): файл, подаден през HISTORY_FILE
const HFILE = process.env.HISTORY_FILE || new URL('../.history.json.gz', import.meta.url).pathname;
import { observe, valuate, priceToEur, identify, yearOf } from './deals.mjs';

const ROOT = new URL('../docs/data/', import.meta.url);
const DAY = 864e5;

// 10 пазарни групи (както в приложението)
export const MCATS = [
  ['backhoe',     'Комбинирани багери',   /мини комбиниран|комбиниран багер|багер[ -]?товарач|backhoe|baggerlader|koparko[- ]?ładowark|buldoexcavator|beko ?loder|kaz[ıi]c[ıi] y[üu]kleyici|terna|tractopelle|retrocargadora|kombinirk|hmk ?\d{2,3} ?(b|s|ss|t)\b|\b[1345] ?cx\b|\bwb ?9\d/i],
  ['minicl',      'Мини челни товарачи',  /мини челен|бобкат|skid ?steer|kompaktlader|minilader|компактен товарач|bobcat s\d|bobcat t\d|minicargadora|minipala|miniładowarka|miniincarcator/i],
  ['telehandler', 'Телескопични товарачи', /телескоп|telehandler|teleskoplader|manitou mt|manitou mrt|ładowarka teleskop|sollevatore telescopico/i],
  ['dumper',      'Дъмпери',              /дъмпер|dumper|raddumper|kettendumper|motocarriola|wozidło|dönerli damper|mini dumper/i],
  ['mini',        'Мини багери',          /мини багер|minibagger|mini ?excavator|kompaktbagger|minikoparka|miniescavatore|minipelle|miniexcavadora|mini ekskavat|\bpc ?[1-5]\d\b|\bkx ?0\d\d|\b[1-5]\d?c ?-?1\b|30[0-5]\.\d/i],
  ['crawler',     'Верижни багери',       /верижен багер|верижни багер|kettenbagger|crawler excavator|koparka gąsienicowa|escavatore cingolato|pelle sur chenilles|excavadora de cadenas|paletli ekskavat|midibagger|миди багер|\bhmk ?\d{3} ?(lc|nlc)|\bpc ?\d{3}\b|\bec ?\d{3}/i],
  ['excavator',   'Колесни багери',       /колесен багер|mobilbagger|wheeled excavator|koparka kołowa|escavatore gommato|pelle sur pneus|lastikli ekskavat|\bhmk ?\d{3} ?w|\bpw ?\d{3}|\bew ?\d{3}/i],
  ['loader',      'Челни товарачи',       /челен товарач|колесен товарач|wheel loader|radlader|ładowarka kołowa|pala gommata|chargeuse|pala cargadora|lastikli y[üu]kleyici|loder y[üu]kleyici|\bwa ?\d{3}|\bl ?\d{3} ?h/i],
  ['roller',      'Валяци',               /валяк|walze|road roller|compactor roller|rullo|walec|silindir|cilindru|rouleau|rodillo|\bars ?\d|\barx ?\d|\bbw ?\d{2,3}|\bsd ?\d{3}/i],
  ['truck',       'Камиони',              /самосвал|камион|сметосъбира|kipper|dreiseiten|tipper|dump truck|wywrotka|müllwagen|lkw|truck|damperli kamyon|basculant|ribaltabile|volquete/i]
];
export const mcatOf = t => (MCATS.find(c => c[2].test(t)) || [null])[0];
// Генерични багери без уточнение → верижни
const GENERIC_EXC = /багер|bagger|excavator|koparka|ekskavat|escavatore|excavadora|pelle/i;

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const isoWeek = d => { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y) / DAY + 1) / 7)).padStart(2, '0')}`; };
const dayKey = d => d.toISOString().slice(0, 10);
async function readJson(name, def) { try { return JSON.parse(await readFile(new URL(name, ROOT), 'utf8')); } catch { return def; } }

// Обявата още ли съществува? (изтрита/продадена → 404/410 или текст за неактивна обява)
const GONE_TXT = /обявата (е )?(изтрита|неактивна|не е активна|е продадена)|няма такава обява|anzeige (ist )?(nicht mehr verfügbar|gelöscht|deaktiviert)|diese anzeige ist nicht mehr|listing (is )?(no longer|not) available|ilan yayında değil|ilan kaldırıldı|anunțul nu (mai )?este|ogłoszenie (jest )?nieaktualne|annuncio non (più )?disponibile|annonce (n'est plus|expirée)|anuncio (ya )?no (está )?disponible/i;
async function stillAlive(url) {
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': 'bg,en;q=0.8' } });
    clearTimeout(tm);
    if (r.status === 404 || r.status === 410) return false;
    if (!r.ok) return null;                                         // блокирано/грешка → не знаем
    const fin = new URL(r.url), orig = new URL(url);
    if (fin.pathname.length < 3 || (fin.pathname !== orig.pathname && !/obiava|anzeige|ilan|listing|details|\d{5,}/i.test(fin.pathname))) return false;
    const html = (await r.text()).slice(0, 300000);
    return !GONE_TXT.test(html);
  } catch { return null; }
}

export async function runAnalytics({ items, turkey = [], deals = [], market, rates, maxChecks = 160 }) {
  const now = new Date(), nowIso = now.toISOString();
  const pool = [...items, ...turkey.filter(t => !items.some(i => i.id === t.id))];

  // ---------- 1) История ----------
  let hist = { items: {} };
  try { hist = JSON.parse(gunzipSync(await readFile(HFILE)).toString('utf8')); } catch {}
  const H = hist.items;
  hist.since ||= nowIso;
  for (const it of pool) {
    if (it.type === 'wanted') continue;
    const title = (it.title || '').replace(/\s*\|.*$/, '');
    const text = title + ' ' + (it.desc || '') + ' ' + (it.hint || '');
    let c = mcatOf(text); if (!c && GENERIC_EXC.test(text)) c = 'crawler';
    if (!c) continue;
    const p = priceToEur(it.price, rates);
    if (!(p >= 2500 && p <= 900000) && !H[it.id]) continue;          // само обяви с цена
    const { brand, model } = identify(title);
    const y = +it.year || +it.yr || yearOf(text, model) || null;
    const h = H[it.id] || (H[it.id] = { f: it.firstSeen || it.date || nowIso });
    Object.assign(h, { c, b: brand || '', m: model || '', p: p && p >= 2500 && p <= 900000 ? Math.round(p) : (h.p || null), y: y || h.y || null, s: it.source, u: it.url, t: title.slice(0, 80), ph: it.photo || h.ph || '' });
    if (it.lastSeen && (!h.l || it.lastSeen > h.l)) h.l = it.lastSeen;
  }
  // Проверка дали изчезналите от търсенето обяви още съществуват
  const PRI = ['backhoe', 'mini', 'crawler', 'excavator', 'loader', 'minicl', 'telehandler', 'roller', 'dumper', 'truck'];
  const toCheck = Object.entries(H).filter(([, h]) => !h.g && h.u && (!h.k || now - new Date(h.k) > DAY) && now - new Date(h.l || h.f) > 12 * 36e5)
    .sort((a, b) => (new Date(a[1].k || 0) - new Date(b[1].k || 0)) || (PRI.indexOf(a[1].c) - PRI.indexOf(b[1].c))).slice(0, maxChecks);
  let goneNow = 0;
  for (let i = 0; i < toCheck.length; i += 6) {
    await Promise.all(toCheck.slice(i, i + 6).map(async ([id, h]) => {
      const a = await stillAlive(h.u); h.k = nowIso;
      if (a === false) { h.g = nowIso; goneNow++; }
    }));
  }
  // Пазим 180 дни
  for (const [id, h] of Object.entries(H)) {
    if (now - new Date(h.g || h.l || h.f) > 90 * DAY) { delete H[id]; continue; }
    if (h.g && now - new Date(h.g) > 14 * DAY) { delete h.t; delete h.ph; }   // за стари продадени пазим само числата
  }
  hist.updated = nowIso;
  await writeFile(HFILE, gzipSync(JSON.stringify(hist)));
  console.log(`История: ${Object.keys(H).length} обяви, проверени ${toCheck.length}, изчезнали сега ${goneNow}`);

  // ---------- 2) Потенциал на всяка обява ----------
  // Базова линия по категория и година (за обяви без достатъчно сравними от същия модел)
  const active = Object.entries(H).filter(([, h]) => !h.g && h.p);
  const base = {};
  for (const [, h] of active) { const k = h.c + '|' + (h.y ? Math.floor(h.y / 3) : 'x'); (base[k] ||= []).push(h.p); }
  const dealIds = new Map(deals.filter(d => !d.suspicious).map(d => [d.id, d]));
  const pot = {};
  for (const it of pool) {
    const d = dealIds.get(it.id);
    if (d) { pot[it.id] = ['p', -d.discount, d.market, d.n, d.conf === 'ниска' ? 0 : 1]; continue; }
    const o = observe(it, rates);
    let p = o?.p, m = null, n = 0, conf = 1;
    if (o) { const v = valuate(o, market.byKey || {}); if (v) { m = v.market; n = v.n; conf = v.conf === 'ниска' ? 0 : 1; } }
    if (!m) {
      const h = H[it.id]; if (!h?.p) continue;
      p = h.p; const arr = base[h.c + '|' + (h.y ? Math.floor(h.y / 3) : 'x')] || [];
      if (arr.length < 6) continue;
      m = Math.round(median(arr)); n = arr.length; conf = 0;
    }
    const r = p / m, pct = Math.round((r - 1) * 100);
    pot[it.id] = [r <= 0.92 ? 'g' : r <= 1.08 ? 'y' : 'r', pct, m, n, conf];
  }
  await writeFile(new URL('potential.json', ROOT), JSON.stringify({ updated: nowIso, items: pot }));

  // ---------- 3) Дневни показатели по категория ----------
  const tr = await readJson('trends.json', { days: {}, weeks: {} });
  const today = dayKey(now);
  const snap = {};
  for (const [c] of MCATS) {
    const act = active.filter(([, h]) => h.c === c).map(([, h]) => h);
    const ps = act.map(h => h.p);
    const newT = Object.values(H).filter(h => h.c === c && h.f.slice(0, 10) === today).length;
    const goneT = Object.values(H).filter(h => h.c === c && h.g && h.g.slice(0, 10) === today);
    snap[c] = { n: act.length, med: median(ps), p25: q(ps, 0.25), p75: q(ps, 0.75), new: newT, gone: goneT.length };
  }
  tr.days[today] = snap;
  for (const k of Object.keys(tr.days)) if (now - new Date(k) > 400 * DAY) delete tr.days[k];

  // ---------- 4) Седмица: показатели и отчет ----------
  const wk = isoWeek(now);
  const weekStart = new Date(now); weekStart.setUTCDate(now.getUTCDate() - ((now.getUTCDay() || 7) - 1)); weekStart.setUTCHours(0, 0, 0, 0);
  const stats = (from, to) => {
    const o = {};
    for (const [c, label] of MCATS) {
      const all = Object.entries(H).filter(([, h]) => h.c === c);
      const entered = all.filter(([, h]) => new Date(h.f) >= from && new Date(h.f) < to);
      const gone = all.filter(([, h]) => h.g && new Date(h.g) >= from && new Date(h.g) < to);
      const act = all.filter(([, h]) => !h.g && h.p).map(([, h]) => h.p);
      const dom = gone.map(([, h]) => Math.max(0, Math.round((new Date(h.g) - new Date(h.f)) / DAY)));
      const brands = {};
      for (const [, h] of all) if (!h.g && h.p && h.b) (brands[h.b] ||= []).push(h.p);
      o[c] = { label, active: act.length, med: median(act), p25: q(act, 0.25), p75: q(act, 0.75), entered: entered.length, gone: gone.length, domMed: median(dom), domFast: dom.length ? Math.min(...dom) : null,
        brands: Object.fromEntries(Object.entries(brands).filter(([, a]) => a.length >= 3).map(([b, a]) => [b, { n: a.length, med: median(a) }]).sort((a, b) => b[1].n - a[1].n).slice(0, 8)) };
    }
    return o;
  };
  tr.weeks[wk] = stats(weekStart, new Date(weekStart.getTime() + 7 * DAY));
  tr.updated = nowIso;
  await writeFile(new URL('trends.json', ROOT), JSON.stringify(tr));

  // Седмичен отчет за изминалата седмица (веднъж, в началото на новата)
  const prevStart = new Date(weekStart.getTime() - 7 * DAY), prevWk = isoWeek(prevStart);
  await mkdir(new URL('weekly/', ROOT), { recursive: true });
  const repFile = new URL(`weekly/${prevWk}.json`, ROOT);
  let made = null;
  if (new Date(hist.since) < weekStart && !(await readJson(`weekly/${prevWk}.json`, null))) {
    const cats = stats(prevStart, weekStart);
    const before = tr.weeks[isoWeek(new Date(prevStart.getTime() - 7 * DAY))] || null;
    for (const [c] of MCATS) if (before?.[c]?.med && cats[c].med) cats[c].medChange = Math.round((cats[c].med / before[c].med - 1) * 100);
    // Топ обяви, влезли през седмицата: лилави (ловец) и зелени, по отстъпка
    const top = Object.entries(H).filter(([id, h]) => new Date(h.f) >= prevStart && new Date(h.f) < weekStart && pot[id] && (pot[id][0] === 'p' || pot[id][0] === 'g'))
      .map(([id, h]) => ({ id, title: h.t, url: h.u, photo: h.ph, cat: h.c, brand: h.b, model: h.m, year: h.y, price: h.p, zone: pot[id][0], pct: pot[id][1], market: pot[id][2], entered: h.f, gone: h.g || null,
        days: Math.round(((h.g ? new Date(h.g) : now) - new Date(h.f)) / DAY) }))
      .sort((a, b) => a.pct - b.pct).slice(0, 15);
    const partial = new Date(hist.since) > prevStart;
    made = { week: prevWk, partial, from: prevStart.toISOString(), to: weekStart.toISOString(), generated: nowIso, cats, top, note: 'Дни на пазара = от първото засичане на обявата до момента, в който е изтрита или неактивна на сайта. Изтриване обикновено означава продажба, но може и да е оттеглена.' };
    await writeFile(repFile, JSON.stringify(made));
    const idx = await readJson('weekly/index.json', { weeks: [] });
    idx.weeks = [prevWk, ...idx.weeks.filter(w => w !== prevWk)].slice(0, 104);
    await writeFile(new URL('weekly/index.json', ROOT), JSON.stringify(idx));
    console.log('Седмичен отчет:', prevWk);
  }
  return { made, potCount: Object.keys(pot).length };
}
