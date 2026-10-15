// ECOBenchmark — „Ловец на сделки“: намира обяви под пазарната цена.
// Пазарната цена се смята от всички обяви за същата марка и модел (и близка година),
// включително от историята на цените (docs/data/market.json), която расте с всяко пускане.

const BGN = 1.95583;
const YEAR_NOW = new Date().getFullYear();

// Марки и как се пишат на кирилица
export const BRANDS = [
  ['Hidromek', /hidromek|хидромек/i], ['JCB', /\bjcb\b|джи ?си ?би/i], ['Komatsu', /komatsu|комацу/i],
  ['Caterpillar', /caterpillar|\bcat\b|катерпилар/i], ['Volvo', /volvo|волво/i], ['Case', /\bcase\b|кейс/i],
  ['New Holland', /new ?holland|ню ?холанд/i], ['Bobcat', /bobcat|бобкат/i], ['Takeuchi', /takeuchi|такеучи/i],
  ['Kubota', /kubota|кубота/i], ['Hitachi', /hitachi|хитачи/i], ['Liebherr', /liebherr|либхер/i],
  ['Doosan', /doosan|дусан/i], ['Develon', /develon/i], ['Hyundai', /hyundai|хюндай/i], ['Terex', /terex|терекс/i],
  ['Manitou', /manitou|маниту/i], ['Ammann', /ammann|аман/i], ['Bomag', /bomag|бомаг/i], ['Dynapac', /dynapac|динапак/i],
  ['Hamm', /\bhamm\b/i], ['Wacker Neuson', /wacker ?neuson|wacker|вакер/i], ['Yanmar', /yanmar|янмар/i],
  ['Kobelco', /kobelco|кобелко/i], ['Mecalac', /mecalac|мекалак/i], ['Sany', /\bsany\b|сани\b/i],
  ['Kramer', /kramer/i], ['Schäffer', /sch(ä|ae)ffer/i], ['Weidemann', /weidemann/i], ['Takraf', /takraf/i],
  ['Atlas', /\batlas\b/i], ['Fiat-Hitachi', /fiat[- ]?hitachi/i], ['Terra', /\bterra\b/i]
];

// Не е цяла машина: кофи, части, гуми, прикачен инвентар, домакински уреди
const NOT_MACHINE = /l(ö|oe)ffel|schaufel|greifer|tiltrotator|schnellwechsler|adapter|anbau|r(ä|ae)der|reifen|felge|ersatz|teile\b|\bf(ü|ue)r\b|\bfor\b|(?:^|\s)за(?=\s)|кофа|бързосменник|гуми|джанти|(?:^|\s)част(?:и)?(?=\s|$|[,.!])|резервн|стойки|кабина|седалка|двигател|помп[аи]|вериг|цилиндър|хладилник|gefrier|k(ü|ue)hl|spielzeug|modell|1:\d{2}|играчк/i;
const PER_PERIOD = /ден|day|tag|час|месец|month|monat|woche|седмиц|\/h\b|mieten|miete|наем/i;

export function priceToEur(p, rates = {}) {
  if (!p) return null;
  const s = String(p).replace(/ /g, ' ');
  if (PER_PERIOD.test(s)) return null;
  let m, n, cur;
  // „€4,490“ / „EUR 12.500“ — валутата отпред
  if ((m = /(€|eur)\s*(\d{1,3}(?:[ .,]\d{3})+|\d+)/i.exec(s))) { n = m[2]; cur = m[1]; }
  // „12 000 €“ / „43.900€“ / „56 242,50 €“ — последното число пред валутата
  else if ((m = /(\d{1,3}(?:[ .]\d{3})+|\d+)(?:,\d{1,2})?\s*(€|eur|евро|лв\.?|bgn|tl|try|₺|usd|\$)/i.exec(s))) { n = m[1]; cur = m[2]; }
  else return null;
  n = parseFloat(String(n).replace(/[ .,](?=\d{3}\b)/g, '').replace(/[ .,]/g, ''));
  if (!isFinite(n) || n <= 0) return null;
  const c = cur.toLowerCase();
  if (/лв|bgn/.test(c)) n /= BGN;
  else if (/usd|\$/.test(c)) n *= 0.92;
  else if (/tl|try|₺/.test(c)) { if (!rates.TRY) return null; n /= rates.TRY; }
  return Math.round(n);
}

export function identify(title) {
  const t = (title || '').replace(/[|].*$/, '');
  for (const [name, rx] of BRANDS) {
    const m = rx.exec(t); if (!m) continue;
    const after = t.slice(m.index + m[0].length).replace(/^[\s:,-]+/, '');
    const toks = after.split(/[\s,/()]+/).filter(Boolean);
    let model = '';
    for (const tk of toks.slice(0, 3)) {
      if (!/^[a-z0-9][a-z0-9.\-]*$/i.test(tk)) break;
      model += tk.toUpperCase();
      if (/\d/.test(model)) break;
    }
    model = model.replace(/[.\-]/g, '');
    if (!/\d/.test(model) || model.length > 10 || /^\d{4}$/.test(model) && +model > 1980 && +model <= YEAR_NOW) return { brand: name, model: '' };
    return { brand: name, model };
  }
  return { brand: '', model: '' };
}

export function yearOf(text, model = '') {
  const s = text || '';
  const m = /(?:bj\.?|baujahr|год(?:ина)?|произв\w*|year|ez|anno|yıl)\s*:?\s*((?:19[89]|20[0-2])\d)\b/i.exec(s)
    || /\b((?:19[89]|20[0-2])\d)\s*(?:г\.|год|y\.)/i.exec(s)
    || /(?:^|[\s/,(])((?:19[89]|20[0-2])\d)(?=[\s/,).]|$)/.exec(s);
  if (!m) return null;
  const y = +m[1];
  if (y > YEAR_NOW || model.includes(String(y))) return null;
  return y;
}

export function hoursOf(text) {
  const m = /(\d{1,3}(?:[ .,]\d{3})|\d{2,5})\s*(?:мч|м\.ч\.?|моточас\w*|motohours|h\b|hrs|hours|std\.?|bh\b|betriebsstunden|stunden|ore\b|saat)/i.exec(text || '');
  if (!m) return null;
  const h = parseInt(m[1].replace(/[ .,]/g, ''), 10);
  return h >= 10 && h <= 40000 ? h : null;
}

const median = a => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
function robust(prices) {
  if (!prices.length) return null;
  const m0 = median(prices);
  const kept = prices.filter(p => p >= m0 / 3 && p <= m0 * 3);
  return kept.length ? median(kept) : m0;
}

// Подготвя наблюдение (цена, година, часове) от обява
export function observe(it, rates) {
  if (it.type && it.type !== 'sale') return null;
  const title = (it.title || '').replace(/\s*\|.*$/, '');
  if (NOT_MACHINE.test(title)) return null;
  const eur = priceToEur(it.price, rates);
  if (!eur || eur < 2500 || eur > 900000) return null;
  const { brand, model } = identify(title);
  if (!brand || !model) return null;
  const text = title + ' ' + (it.desc || '');
  return { id: it.id, key: `${brand}|${model}`, brand, model, p: eur, y: it.yr || yearOf(text, model), h: it.mh || hoursOf(text), src: it.source, f: !!it.foreign, t: it.firstSeen || it.date };
}

// Обновява историята на цените: по едно наблюдение на обява, пази 120 дни, до 80 на модел
export function updateMarket(market, items, rates) {
  const cutoff = Date.now() - 120 * 864e5;
  const byKey = market.byKey || {};
  for (const it of items) {
    const o = observe(it, rates); if (!o) continue;
    const arr = byKey[o.key] || (byKey[o.key] = []);
    const i = arr.findIndex(x => x.id === o.id);
    const row = { id: o.id, p: o.p, y: o.y, h: o.h, f: o.f, t: o.t };
    if (i >= 0) arr[i] = row; else arr.push(row);
  }
  for (const k of Object.keys(byKey)) {
    byKey[k] = byKey[k].filter(x => new Date(x.t).getTime() > cutoff).slice(-80);
    if (!byKey[k].length) delete byKey[k];
  }
  return { updated: new Date().toISOString(), byKey };
}

// Оценка на една обява спрямо пазара
export function valuate(o, byKey) {
  const all = (byKey[o.key] || []).filter(x => x.id !== o.id);
  let comps = [], basis = '', conf = '';
  if (o.y) {
    const near = all.filter(x => x.y && Math.abs(x.y - o.y) <= 2);
    if (near.length >= 4) { comps = near; basis = `${o.y - 2}–${o.y + 2} г.`; conf = near.length >= 8 ? 'висока' : 'средна'; }
  }
  if (!comps.length) {
    if (all.length < 6) return null;
    // Без година сравняваме само ако моделът е в тесен ценови диапазон
    const ps = all.map(x => x.p).sort((a, b) => a - b);
    const spread = ps[Math.floor(ps.length * 0.75)] / ps[Math.floor(ps.length * 0.25)];
    if (spread > 1.8) return null;
    comps = all; basis = 'всички години'; conf = 'ниска';
  }
  const market = robust(comps.map(x => x.p));
  const domestic = comps.filter(x => !x.f).map(x => x.p);
  return { market: Math.round(market), marketBG: domestic.length >= 3 ? Math.round(robust(domestic)) : null, n: comps.length, basis, conf };
}

// Главна функция: връща сделките (обяви под пазара), сортирани по отстъпка
export function findDeals(items, market, rates, cfg = {}) {
  const min = cfg.minDiscount ?? 0.15, max = cfg.maxDiscount ?? 0.6;
  const tr = cfg.transport || { BG: 500, foreign: 2500 };
  const fee = cfg.brokerFee ?? 0.03;
  const out = [];
  for (const it of items) {
    const o = observe(it, rates); if (!o) continue;
    const v = valuate(o, market.byKey || {}); if (!v) continue;
    const disc = 1 - o.p / v.market;
    if (disc < min) continue;
    const resale = v.marketBG || v.market;
    const transport = it.foreign ? tr.foreign : tr.BG;
    out.push({
      id: it.id, url: it.url, title: (it.title || '').replace(/\s*\|.*$/, ''), photo: it.photo, source: it.source,
      foreign: !!it.foreign, location: it.location || '', firstSeen: it.firstSeen || it.date,
      brand: o.brand, model: o.model, year: o.y, hours: o.h,
      price: o.p, market: v.market, marketBG: v.marketBG, n: v.n, basis: v.basis, conf: v.conf,
      discount: Math.round(disc * 100),
      suspicious: disc > max,
      profit: Math.round(resale - o.p - transport),
      commission: Math.round(o.p * fee)
    });
  }
  return out.sort((a, b) => (a.suspicious - b.suspicious) || (b.discount - a.discount));
}

// Година и моточасове от детайлната страница на обявата (таблицата с характеристики)
const YEAR_LABEL = /(година на производство|дата на производство|произведен[аo]?|година|baujahr|erstzulassung|year of manufacture|year|model y[ıi]l[ıi]|y[ıi]l|anul fabrica\S*|an fabrica\S*|anno|godina proizvodnje|rok produkcji)/i;
const HOURS_LABEL = /(моточасове|мото ?часове|работни часове|отработени часове|betriebsstunden|operating hours|hours|[çc]al[ıi][şs]ma saati|ore di lavoro|ore funzionare|motogodziny|radni sati|horas)/i;
export function factsFromHtml(html) {
  const text = (html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
  let yr = null, mh = null;
  for (const m of text.matchAll(new RegExp(YEAR_LABEL.source, 'gi'))) {
    const y = /^[\s:.\-–]{0,4}(?:[^0-9]{0,25}?)((?:19[89]|20[0-2])\d)\b/.exec(text.slice(m.index + m[0].length, m.index + m[0].length + 40));
    if (y && +y[1] <= YEAR_NOW) { yr = +y[1]; break; }
  }
  for (const m of text.matchAll(new RegExp(HOURS_LABEL.source, 'gi'))) {
    const h = /^[\s:.\-–]{0,4}(?:[^0-9]{0,12}?)(\d{1,3}(?:[ .,]\d{3})|\d{2,5})(?![\d])/.exec(text.slice(m.index + m[0].length, m.index + m[0].length + 30));
    if (h) { const v = parseInt(h[1].replace(/[ .,]/g, ''), 10); if (v >= 10 && v <= 40000) { mh = v; break; } }
  }
  if (!mh) mh = hoursOf(text.slice(0, 20000));
  return { yr, mh };
}
