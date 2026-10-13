'use strict';
// ===== СтройРадар =====
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SOURCES = {
  olx:           { name: 'OLX.bg',        flag: '🇧🇬', link: q => `https://www.olx.bg/ads/q-${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}/` },
  mobilebg:      { name: 'Mobile.bg',     flag: '🇧🇬', link: q => `https://www.google.com/search?q=${encodeURIComponent('site:mobile.bg ' + q)}` },
  bazar:         { name: 'Bazar.bg',      flag: '🇧🇬', link: q => `https://bazar.bg/obiavi?q=${encodeURIComponent(q)}` },
  mascus:        { name: 'Mascus',        flag: '🌍', foreign: true, link: q => `https://www.mascus.bg/+/${encodeURIComponent(q)},1,relevance,search.html` },
  machineryline: { name: 'Machineryline', flag: '🌍', foreign: true, link: q => `https://machineryline.bg/-/search?q=${encodeURIComponent(q)}` },
  autoline:      { name: 'Autoline',      flag: '🌍', foreign: true, link: q => `https://autoline.bg/-/search?q=${encodeURIComponent(q)}` },
  truck1:        { name: 'Truck1',        flag: '🌍', foreign: true, link: q => `https://www.truck1.eu/construction-machinery?q=${encodeURIComponent(q)}` },
  mobilede:      { name: 'Mobile.de',     flag: '🇩🇪', foreign: true, link: q => `https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&vc=ConstructionMachine&s=Construction&q=${encodeURIComponent(q)}` },
  truckscout24:  { name: 'TruckScout24',  flag: '🇩🇪', foreign: true, link: q => `https://www.truckscout24.de/baumaschinen?query=${encodeURIComponent(q)}` },
  machinio:      { name: 'Machinio',      flag: '🌍', foreign: true, link: q => `https://www.machinio.com/search?q=${encodeURIComponent(q)}` }
};
const FB = [
  { name: 'Marketplace', link: q => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(q)}` },
  { name: 'Публикации', link: q => `https://www.facebook.com/search/posts/?q=${encodeURIComponent(q)}` },
  { name: 'Групи', link: q => `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q)}` }
];
const TYPES = {
  all:     { label: 'Всички' },
  wanted:  { label: '🔴 Търсят', badge: 'ТЪРСИ' },
  sale:    { label: '🟢 Продават', badge: 'ПРОДАВА' },
  service: { label: '🛠 Сервиз и части', badge: 'СЕРВИЗ' },
  rent:    { label: '🔵 Под наем', badge: 'НАЕМ' }
};
const NTFY_TOPIC = 'stroiradar-ng-c2e7b1bf';

// ----- Състояние (localStorage, с предпазване) -----
const store = {
  get(k, d) { try { const v = localStorage.getItem('sr.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sr.' + k, JSON.stringify(v)); } catch {} }
};
const S = {
  keywords: store.get('keywords', ['Hidromek', 'Ammann', 'FAE', 'IMEKS', 'Atmos', 'Grundomat', 'мулчер', 'валяк', 'багер товарач', 'хидравличен чук', 'генератор']),
  favs: store.get('favs', {}),
  disabled: store.get('disabled', []),
  type: 'all', src: 'all', onlyKw: store.get('onlyKw', false),
  ack: store.get('ack', Date.now() - 864e5),          // до кога е „видяно“
  notifKw: store.get('notifKw', true), notifWanted: store.get('notifWanted', false),
  notified: store.get('notified', []),
  liveUrl: store.get('liveUrl', ''), scope: 'all', theme: store.get('theme', ''),
  items: [], updated: null, newOnly: false
};
const save = () => {
  ['keywords', 'favs', 'disabled', 'onlyKw', 'ack', 'notifKw', 'notifWanted', 'liveUrl', 'theme'].forEach(k => store.set(k, S[k]));
  store.set('notified', S.notified.slice(-800));
  syncPrefsToSW();
};

// ----- Помощни -----
function ago(d) {
  const m = Math.round((Date.now() - new Date(d)) / 6e4);
  if (m < 1) return 'току-що'; if (m < 60) return `преди ${m} мин`;
  const h = Math.round(m / 60); if (h < 24) return `преди ${h} ч`;
  const dd = Math.round(h / 24); return dd === 1 ? 'вчера' : `преди ${dd} дни`;
}
const norm = s => (s || '').toLowerCase();
const kwMatch = it => { const t = norm(it.title + ' ' + it.desc); return S.keywords.some(k => t.includes(norm(k))); };
const when = it => new Date(it.firstSeen || it.date).getTime();
const isNew = it => when(it) > S.ack;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2400); }
function wantsNotify(it) { return (!S.notifKw || kwMatch(it)) && (!S.notifWanted || it.type === 'wanted'); }

// ----- Карта -----
function card(it) {
  const src = SOURCES[it.source] || { name: it.source, flag: '🌐' };
  const fav = !!S.favs[it.id];
  const t = TYPES[it.type] || TYPES.sale;
  const ph = it.photo ? `<div class="ph" style="background-image:url('${esc(it.photo)}')">` : `<div class="ph none">🚜`;
  return `<article class="card ${isNew(it) ? 'new' : ''}">
    ${ph}<span class="badge b-${esc(it.type || 'sale')}">${t.badge}</span>${isNew(it) ? '<span class="newtag">НОВО</span>' : ''}</div>
    <div class="body">
      <div class="title">${esc(it.title)}</div>
      ${it.price ? `<div class="price">${esc(it.price)}</div>` : ''}
      <div class="meta"><span>${src.flag} ${esc(src.name)}</span>${it.location ? `<span>📍 ${esc(it.location)}</span>` : ''}<span>🕒 ${ago(it.firstSeen || it.date)}</span>${kwMatch(it) ? '<span>🔑</span>' : ''}</div>
      <div class="actions"><a class="btn primary" href="${esc(it.url)}" target="_blank" rel="noopener">Отвори обявата</a><button class="btn star ${fav ? 'on' : ''}" data-fav="${esc(it.id)}" aria-label="Любима">${fav ? '★' : '☆'}</button></div>
    </div></article>`;
}

// ----- Радар -----
function visible() {
  return S.items.filter(it =>
    !S.disabled.includes(it.source) &&
    (S.type === 'all' || it.type === S.type) &&
    (S.src === 'all' || (S.src === 'bg' ? !SOURCES[it.source]?.foreign : SOURCES[it.source]?.foreign)) &&
    (!S.onlyKw || kwMatch(it)) && (!S.newOnly || isNew(it)));
}
function renderChips() {
  const base = S.items.filter(it => !S.disabled.includes(it.source));
  $('#typeChips').innerHTML = Object.entries(TYPES).map(([k, v]) => {
    const n = k === 'all' ? base.length : base.filter(i => i.type === k).length;
    return `<button class="chip ${S.type === k ? 'on' : ''}" data-type="${k}">${v.label}<span class="n">${n}</span></button>`;
  }).join('');
  $('#srcChips').innerHTML = [['all', '🌐 Всички сайтове'], ['bg', '🇧🇬 България'], ['foreign', '🌍 Чужбина']]
    .map(([k, l]) => `<button class="chip ${S.src === k ? 'on' : ''}" data-src="${k}">${l}</button>`).join('')
    + (S.newOnly ? `<button class="chip on" data-newoff="1">🔔 Само новите ✕</button>` : '');
}
function renderFeed() {
  renderChips();
  const v = visible();
  $('#count').textContent = `${v.length} обяви`;
  $('#feed').innerHTML = v.length ? v.slice(0, 300).map(card).join('')
    : `<div class="empty"><b>📭</b>${S.items.length ? 'Няма обяви по този филтър.' : 'Още няма събрани обяви. Първото събиране тръгва до 20 минути след пускането.'}</div>`;
  const nNew = S.items.filter(i => isNew(i) && wantsNotify(i) && !S.disabled.includes(i.source)).length;
  $('#bell').classList.toggle('on', nNew > 0);
  $('#bellCnt').textContent = nNew > 99 ? '99+' : nNew;
  if ('setAppBadge' in navigator) { try { nNew ? navigator.setAppBadge(nNew) : navigator.clearAppBadge(); } catch {} }
  document.title = nNew ? `(${nNew}) СтройРадар` : 'СтройРадар';
}
function renderFavs() {
  const f = Object.values(S.favs).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  $('#favList').innerHTML = f.length ? f.map(card).join('') : `<div class="empty"><b>☆</b>Натисни звездичката на обява, за да я запазиш тук.</div>`;
}

// ----- Зареждане на данни -----
async function load(silent) {
  try {
    const r = await fetch('data/listings.json?t=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    S.items = j.items || []; S.updated = j.updated;
    $('#upd').textContent = S.updated ? `Обновено ${ago(S.updated)} · ${S.items.length} обяви` : 'Няма данни още';
    renderFeed();
    notifyNew();
  } catch (e) {
    $('#upd').textContent = navigator.onLine ? 'Няма данни още' : 'Офлайн';
    if (!silent) renderFeed();
  }
}

async function notifyNew() {
  const fresh = S.items.filter(i => isNew(i) && wantsNotify(i) && !S.notified.includes(i.id) && !S.disabled.includes(i.source));
  if (!fresh.length) return;
  S.notified.push(...fresh.map(i => i.id)); save();
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.ready;
  for (const it of fresh.slice(0, 5)) {
    const src = SOURCES[it.source] || {};
    reg?.showNotification(`${it.type === 'wanted' ? '🔴 ТЪРСИ' : '🔔 Нова обява'} · ${src.flag || ''} ${src.name || ''}`, {
      body: `${it.title}${it.price ? '\n💰 ' + it.price : ''}`, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
      image: it.photo || undefined, tag: it.id, data: { url: it.url }, vibrate: [200, 100, 200]
    });
  }
  if (fresh.length > 5) reg?.showNotification(`🔔 Още ${fresh.length - 5} нови обяви`, { icon: 'icons/icon-192.png', tag: 'more', data: { url: './' } });
}

// ----- Търсачка -----
function renderScope() {
  $('#scopeChips').innerHTML = [['all', '🌐 Навсякъде'], ['bg', '🇧🇬 България'], ['foreign', '🌍 Чужбина']]
    .map(([k, l]) => `<button class="chip ${S.scope === k ? 'on' : ''}" data-scope="${k}">${l}</button>`).join('');
}
const inScope = k => S.scope === 'all' || (S.scope === 'foreign' ? !!SOURCES[k]?.foreign : !SOURCES[k]?.foreign);

async function doSearch(q) {
  q = q.trim(); if (!q) return;
  const words = norm(q).split(/\s+/);
  const local = S.items.filter(it => inScope(it.source) && words.every(w => norm(it.title + ' ' + it.desc).includes(w)));
  const siteBtns = Object.entries(SOURCES).filter(([k]) => inScope(k))
    .map(([, s]) => `<a class="site" href="${esc(s.link(q))}" target="_blank" rel="noopener"><span>${s.flag}</span>${esc(s.name)}</a>`).join('');
  const fbBtns = S.scope !== 'foreign' || true ? FB.map(f => `<a class="site fb" href="${esc(f.link(q))}" target="_blank" rel="noopener"><span>f</span>${f.name}</a>`).join('') : '';
  $('#sResults').innerHTML = `
    <div class="sect">Отвори търсенето в сайтовете</div><div class="sites">${siteBtns}</div>
    <div class="sect">Facebook</div><div class="sites">${fbBtns}</div>
    <div id="liveBox"></div>
    <div class="sect">В събраните обяви · ${local.length}</div>
    <div class="list">${local.length ? local.slice(0, 100).map(card).join('') : '<div class="empty" style="padding:20px"><b>🔎</b>Няма съвпадения в събраните обяви.</div>'}</div>`;
  if (S.liveUrl) {
    $('#liveBox').innerHTML = `<div class="sect">На живо от сайтовете <span class="spin">⏳</span></div>`;
    try {
      const r = await fetch(`${S.liveUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(q)}&scope=${S.scope}`);
      const j = await r.json();
      const its = (j.items || []).filter(i => !S.disabled.includes(i.source));
      $('#liveBox').innerHTML = `<div class="sect">На живо от сайтовете · ${its.length}</div><div class="list">${its.map(card).join('') || '<div class="empty" style="padding:20px">Няма резултати.</div>'}</div>`;
      S.liveCache = Object.fromEntries(its.map(i => [i.id, i]));
    } catch { $('#liveBox').innerHTML = `<div class="sect">На живо</div><div class="note">Търсачката на живо не отговаря в момента.</div>`; }
  }
}

// ----- Настройки -----
function renderSettings() {
  $('#kwList').innerHTML = S.keywords.map((k, i) => `<span class="chip">${esc(k)}<i data-kwdel="${i}">✕</i></span>`).join('') || '<span class="st">Няма добавени думи.</span>';
  $('#notifKw').checked = S.notifKw; $('#notifWanted').checked = S.notifWanted;
  $('#onlyKw').checked = S.onlyKw; $('#liveUrl').value = S.liveUrl;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  $('#notifBtn').textContent = perm === 'granted' ? '✓ Включени' : perm === 'denied' ? 'Блокирани' : 'Разреши';
  $('#ntfyBtn').href = `https://ntfy.sh/${NTFY_TOPIC}`;
  $('#ntfyNote').textContent = `За моментални известия дори при затворено приложение: инсталирай „ntfy“ от Google Play и се абонирай за темата „${NTFY_TOPIC}“.`;
  $('#srcSet').innerHTML = Object.entries(SOURCES).map(([k, s]) => {
    const n = S.items.filter(i => i.source === k).length;
    return `<label class="sw"><span>${s.flag} ${esc(s.name)} <span class="st">· ${n} обяви</span></span><input type="checkbox" data-srcset="${k}" ${S.disabled.includes(k) ? '' : 'checked'}></label>`;
  }).join('');
}

// ----- Service worker (известия във фона) -----
async function syncPrefsToSW() {
  try {
    const c = await caches.open('sr-prefs');
    await c.put('prefs', new Response(JSON.stringify({ keywords: S.keywords, notifKw: S.notifKw, notifWanted: S.notifWanted, disabled: S.disabled, ack: S.ack, notified: S.notified.slice(-800) })));
  } catch {}
}
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    if ('periodicSync' in reg) {
      try {
        const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (st.state === 'granted') await reg.periodicSync.register('check-listings', { minInterval: 30 * 60 * 1000 });
      } catch {}
    }
    navigator.serviceWorker.addEventListener('message', e => { if (e.data?.notified) { S.notified = [...new Set([...S.notified, ...e.data.notified])]; store.set('notified', S.notified.slice(-800)); } });
  } catch {}
}

// ----- Събития -----
function show(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('#feedFilters').style.display = v === 'feed' ? '' : 'none';
  $('#hTitle').firstChild.textContent = { feed: 'СтройРадар', search: 'Търсачка', fav: 'Любими', set: 'Настройки' }[v];
  if (v === 'fav') renderFavs();
  if (v === 'set') renderSettings();
  if (v === 'search') { renderScope(); setTimeout(() => $('#sQ').focus(), 50); }
  window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const b = e.target.closest('button, i, a'); if (!b) return;
  const d = b.dataset;
  if (d.v) show(d.v);
  else if (d.type) { S.type = d.type; renderFeed(); }
  else if (d.src) { S.src = d.src; renderFeed(); }
  else if (d.newoff) { S.newOnly = false; S.ack = Date.now(); save(); renderFeed(); }
  else if (d.scope) { S.scope = d.scope; renderScope(); if ($('#sQ').value) doSearch($('#sQ').value); }
  else if (d.kwdel != null) { S.keywords.splice(+d.kwdel, 1); save(); renderSettings(); renderFeed(); }
  else if (d.th != null) { S.theme = d.th; applyTheme(); save(); }
  else if (d.fav) {
    const it = S.items.find(i => i.id === d.fav) || S.liveCache?.[d.fav] || S.favs[d.fav];
    if (S.favs[d.fav]) { delete S.favs[d.fav]; toast('Премахната от любими'); }
    else if (it) { S.favs[d.fav] = { ...it, savedAt: Date.now() }; toast('★ Запазена в любими'); }
    save(); b.classList.toggle('on'); b.textContent = S.favs[d.fav] ? '★' : '☆';
    if ($('#v-fav').classList.contains('on')) renderFavs();
  }
});
$('#bell').onclick = () => {
  show('feed');
  if ($('#bell').classList.contains('on')) { S.newOnly = true; S.type = 'all'; renderFeed(); toast('Показвам новите обяви'); }
  else toast('Няма нови обяви');
};
$('#onlyKw').onchange = e => { S.onlyKw = e.target.checked; save(); renderFeed(); };
$('#notifKw').onchange = e => { S.notifKw = e.target.checked; save(); renderFeed(); };
$('#notifWanted').onchange = e => { S.notifWanted = e.target.checked; save(); renderFeed(); };
$('#srcSet').onchange = e => { const k = e.target.dataset.srcset; if (!k) return; S.disabled = e.target.checked ? S.disabled.filter(x => x !== k) : [...S.disabled, k]; save(); renderFeed(); };
$('#kwForm').onsubmit = e => { e.preventDefault(); const v = $('#kwIn').value.trim(); if (v && !S.keywords.some(k => norm(k) === norm(v))) { S.keywords.push(v); save(); renderSettings(); renderFeed(); toast(`🔑 „${v}“ е добавена`); } $('#kwIn').value = ''; };
$('#sForm').onsubmit = e => { e.preventDefault(); $('#sQ').blur(); doSearch($('#sQ').value); };
$('#liveSave').onclick = () => { S.liveUrl = $('#liveUrl').value.trim(); save(); toast('Запазено'); };
$('#notifBtn').onclick = async () => {
  if (!('Notification' in window)) return toast('Телефонът не поддържа известия тук');
  const p = await Notification.requestPermission();
  if (p === 'granted') { await registerSW(); (await navigator.serviceWorker.ready).showNotification('🔔 СтройРадар', { body: 'Известията са включени. Ще те алармирам при нова обява.', icon: 'icons/icon-192.png' }); }
  renderSettings();
};

// Инсталиране
let deferred;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBar').classList.add('on'); });
$('#installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBar').classList.remove('on'); };

function applyTheme() { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; }

// „Видяно“ — когато излезеш от приложението, текущите обяви спират да са нови
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !S.newOnly) { S.ack = Date.now(); save(); }
  else if (!document.hidden) load(true);
});

applyTheme();
registerSW();
load();
setInterval(() => load(true), 5 * 60 * 1000);
