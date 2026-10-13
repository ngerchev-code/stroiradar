// Общо ядро за СтройРадар — работи и в Node (GitHub Actions), и в Cloudflare Worker (търсачката).
// Без външни библиотеки: само fetch + регулярни изрази + og: тагове.

const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';

// ---------- Класификация ----------
const WANT = /(търс(я|им|и се)|купувам|изкупувам|купуваме|нужен|нужна|необходим|wanted|suche|kaufe|търся под наем|наемам)/i;
const SERVICE = /(ремонт|сервиз|сервизн|диагностик|резервн\w* част|части за|хидравли\w* ремонт|сварки|заварки|сервисни услуги|repair|service|ersatzteil|spare part)/i;
const RENT = /(под наем|наем|наемане|rent|miete|vermiet)/i;

export function classify(text) {
  const t = (text || '').toLowerCase();
  if (WANT.test(t)) return 'wanted';
  if (SERVICE.test(t)) return 'service';
  if (RENT.test(t)) return 'rent';
  return 'sale';
}

// ---------- Филтър по бранша ----------
export const RELEVANT = /багер|товарач|валяк|виброплоч|трамбовк|пачекрак|чук|къртач|мулчер|асфалт|фреза|трошачк|сито|генератор|компресор|телескоп|булдозер|грейдер|къртиц|сондаж|бобкат|самосвал|кран|вишка|челен|верижен|кофа|бързосменник|инвентар|строителн|земни работи|изкоп|хидравли|excavator|loader|backhoe|roller|compactor|breaker|mulcher|paver|crusher|screen|generator|compressor|telehandler|dozer|grader|bagger|lader|walze|platte|hammer|koparka|ładowark|excavator|buldoexcavator|încărcător|cilindru|hidromek|ammann|jcb|caterpillar|\bcat\b|komatsu|volvo|case|bobcat|takeuchi|kubota|hitachi|liebherr|doosan|develon|hyundai|new holland|terex|manitou|merlo|bomag|dynapac|hamm|wacker|fae|imeks|hycon|atmos|grundomat|tracto|rioned|komplet|yanmar|kobelco|sany|xcmg|liugong|mecalac|kramer|weidemann|avant|gehl|sdmo|aksa|bager|valyak|tovarach|kofa|chuk|vibroplocha|trambovka|kompresor|vishka|buldozer|greyder|kartitsa|frez|asfalt/i;

// ---------- Помощни ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
export function decode(s) {
  return (s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getText(url, timeout = 15000, extra = {}) {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8', 'Accept-Language': 'bg,en;q=0.8,de;q=0.6', ...extra }, signal: ctrl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = new Uint8Array(await r.arrayBuffer());
    const ct = r.headers.get('content-type') || '';
    let enc = /charset=([\w-]+)/i.exec(ct)?.[1];
    if (!enc) {
      const head = new TextDecoder('latin1').decode(buf.slice(0, 3000));
      enc = /charset=["']?([\w-]+)/i.exec(head)?.[1] || 'utf-8';
    }
    try { return new TextDecoder(enc.toLowerCase()).decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
  } finally { clearTimeout(tm); }
}

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  const m = re.exec(html);
  return m ? decode(m[1] ?? m[2]) : '';
}

function priceFrom(text) {
  const m = /(\d[\d\s.,]{2,})\s*(лв\.?|bgn|€|eur|евро|usd|\$)/i.exec(text || '') || /(€|eur)\s*(\d[\d\s.,]{2,})/i.exec(text || '');
  if (!m) return '';
  return decode(m[0]).replace(/\s+/g, ' ');
}

// ---------- OLX.bg (публичен JSON) ----------
async function searchOlx(q, domain = 'www.olx.bg') {
  const url = `https://${domain}/api/v1/offers/?offset=0&limit=40&sort_by=created_at:desc&query=${encodeURIComponent(q)}`;
  const j = JSON.parse(await getText(url, 15000, { Accept: 'application/json', Referer: `https://${domain}/` }));
  return (j.data || []).map(o => {
    const price = (o.params || []).find(p => p.key === 'price')?.value;
    const photo = o.photos?.[0]?.link?.replace('{width}', '640').replace('{height}', '480') || '';
    const desc = decode(o.description || '').slice(0, 400);
    return {
      id: 'olx-' + o.id, source: 'olx', url: o.url, title: decode(o.title),
      price: price?.label || (price?.value ? `${price.value} ${price.currency || ''}` : ''),
      location: [o.location?.city?.name, o.location?.region?.name].filter(Boolean).join(', '),
      photo, desc, date: o.created_time || o.last_refresh_time || new Date().toISOString()
    };
  });
}

// ---------- Общ HTML търсач (Mobile.bg, Bazar, чужди сайтове) ----------
function extractLinks(html, baseUrl, pattern) {
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  // auto: линкове към същия сайт с дълъг номер на обява
  const host = new URL(baseUrl).host;
  const pat = pattern === 'auto' ? { test: h => { try { const u = new URL(h, baseUrl); return u.host === host && /\d{5,}/.test(u.pathname + u.search) && !/search|page=|login|register/i.test(u.href); } catch { return false; } } } : new RegExp(pattern, 'i');
  const out = new Map();
  const hits = [];
  let m;
  while ((m = re.exec(html))) { if (pat.test(m[1])) hits.push({ href: m[1], inner: m[2], at: m.index }); }
  hits.forEach((h, i) => {
    let href;
    try { href = new URL(h.href, baseUrl).href; } catch { return; }
    const text = decode(h.inner);
    const img = /<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i.exec(h.inner)?.[1];
    // Контекст: от тази обява до следващата (за цена)
    let end = h.at + 1500;
    for (let j = i + 1; j < hits.length; j++) { if (hits[j].href !== h.href) { end = Math.min(end, hits[j].at); break; } }
    const ctx = decode(html.slice(h.at, end));
    const prev = out.get(href);
    out.set(href, {
      url: href,
      title: text.length > (prev?.title.length || 8) ? text : (prev?.title || ''),
      photo: prev?.photo || (img && !img.startsWith('data:') ? new URL(img, baseUrl).href : ''),
      price: prev?.price || priceFrom(ctx) || ''
    });
  });
  return [...out.values()];
}

export async function enrich(item) {
  // Детайлна страница → og: тагове (заглавие, снимка, описание)
  try {
    const html = await getText(item.url, 12000);
    item.title = meta(html, 'og:title') || item.title || decode(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]);
    item.photo = meta(html, 'og:image') || item.photo;
    item.desc = (meta(html, 'og:description') || meta(html, 'description')).slice(0, 400);
    const amt = meta(html, 'product:price:amount') || meta(html, 'og:price:amount');
    const cur = meta(html, 'product:price:currency') || meta(html, 'og:price:currency');
    if (amt) item.price = `${amt} ${cur || ''}`.trim();
    else if (!item.price) item.price = priceFrom(meta(html, 'og:description')) || priceFrom(decode(html.slice(0, 60000)));
  } catch { /* ок — остава каквото е намерено в списъка */ }
  return item;
}

async function searchHtml(key, src, q, { enrichDetails = true } = {}) {
  const slug = (q || '').toLowerCase().trim().replace(/\s+/g, '-');
  const urls = q && src.search ? [src.search.replace('{q}', encodeURIComponent(q)).replace('{slug}', encodeURIComponent(slug).replace(/%2D/g, '-'))] : (src.pages || []);
  let items = [], fails = 0, lastErr = '';
  for (const u of urls) {
    try {
      const html = await getText(u);
      if (globalThis.__debugDump) globalThis.__debugDump(key, u, html);
      items.push(...extractLinks(html, u, src.linkPattern));
    } catch (e) { fails++; lastErr = e.message; }
  }
  if (urls.length && fails === urls.length) throw new Error(lastErr || 'няма отговор');
  // Mobile.bg няма стабилно търсене по URL — филтрираме по заглавие
  if (q && !src.search) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter(i => words.every(w => i.title.toLowerCase().includes(w)));
  }
  items = items.slice(0, 25);
  if (enrichDetails) {
    for (let i = 0; i < items.length; i += 5) await Promise.all(items.slice(i, i + 5).map(enrich));
  }
  return items.filter(i => i.title).map(i => ({
    id: key + '-' + hash(i.url), source: key, url: i.url, title: i.title, price: i.price || '',
    location: '', photo: i.photo || '', desc: i.desc || '', date: new Date().toISOString()
  }));
}

export function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// ---------- Публичен вход ----------
export async function searchSource(key, src, q, opts) {
  const items = src.olx ? (await searchOlx(q || 'строителна техника', src.domain)).map(i => ({ ...i, id: i.id.replace(/^olx-/, key + '-'), source: key })) : await searchHtml(key, src, q, opts);
  for (const it of items) {
    it.type = classify(it.title + ' ' + it.desc);
    it.foreign = !!src.foreign;
  }
  return items;
}

export async function searchAll(config, q, opts = {}) {
  const keys = Object.keys(config.sources).filter(k => config.sources[k].enabled && (!opts.only || opts.only.includes(k)));
  const results = await Promise.allSettled(keys.map(k => searchSource(k, config.sources[k], q, opts)));
  const items = [], status = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') { items.push(...r.value); status[keys[i]] = { ok: true, count: r.value.length }; }
    else status[keys[i]] = { ok: false, error: String(r.reason?.message || r.reason) };
  });
  return { items, status };
}
