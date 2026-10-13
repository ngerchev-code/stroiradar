// ECOBenchmark — service worker: офлайн, известия, проверка във фона
const V = 'bb-v16';
const SHELL = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'icons/icon-192-eb2.png', 'icons/icon-512-eb2.png', 'icons/badge-96-eb2.png'];

// Инсталиране: взимаме файловете директно от мрежата (без HTTP кеша), за да не запишем стара версия
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => fetch(u, { cache: 'reload' }).then(r => r.ok && c.put(u, r)).catch(() => {}))))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'sr-prefs').map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Всичко от приложението: първо мрежата (винаги най-новото), кешът е само за офлайн
  e.respondWith(fetch(u.href, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// Проверка за нови обяви във фона (Android Chrome, инсталирано приложение)
async function check() {
  const c = await caches.open('sr-prefs');
  const pr = await c.match('prefs');
  const p = pr ? await pr.json() : { keywords: [], notifKw: false, notifWanted: false, disabled: [], ack: Date.now(), notified: [] };
  const r = await fetch('data/listings.json?t=' + Date.now(), { cache: 'no-store' });
  const { items = [] } = await r.json();
  const kw = (p.keywords || []).map(k => k.toLowerCase());
  const ALARM = /hidromek|хидромек|\bhmk ?\d{2,3}/i;
  const alarm = items.filter(it => ALARM.test(it.title + ' ' + (it.desc || '')) && !(p.notified || []).includes(it.id) && new Date(it.firstSeen || it.date).getTime() > p.ack);
  for (const it of alarm.slice(0, 5)) await self.registration.showNotification('🚨 HIDROMEK — нова обява', { body: `${it.title}${it.price ? '\n' + it.price : ''}`, icon: 'icons/icon-192-eb2.png', badge: 'icons/badge-96-eb2.png', image: it.photo || undefined, tag: 'alarm-' + it.id, requireInteraction: true, renotify: true, vibrate: [300, 120, 300, 120, 500], data: { url: it.url } });
  p.notified = [...(p.notified || []), ...alarm.map(i => i.id)];
  const fresh = items.filter(it => {
    if (p.disabled?.includes(it.source) || p.notified?.includes(it.id)) return false;
    if (new Date(it.firstSeen || it.date).getTime() <= p.ack) return false;
    const t = (it.title + ' ' + (it.desc || '')).toLowerCase();
    if (p.notifKw && !kw.some(k => t.includes(k))) return false;
    if (p.notifWanted && it.type !== 'wanted') return false;
    return true;
  });
  if (!fresh.length) return;
  for (const it of fresh.slice(0, 4)) {
    await self.registration.showNotification(it.type === 'wanted' ? 'Търсят техника' : 'Нова обява', {
      body: `${it.title}${it.price ? '\n💰 ' + it.price : ''}`, icon: 'icons/icon-192-eb2.png', badge: 'icons/badge-96-eb2.png',
      image: it.photo || undefined, tag: it.id, data: { url: it.url }, vibrate: [200, 100, 200]
    });
  }
  if (fresh.length > 4) await self.registration.showNotification(`🔔 Още ${fresh.length - 4} нови обяви`, { icon: 'icons/icon-192-eb2.png', tag: 'more', data: { url: './' } });
  p.notified = [...(p.notified || []), ...fresh.map(i => i.id)].slice(-800);
  await c.put('prefs', new Response(JSON.stringify(p)));
  try { if (self.navigator.setAppBadge) self.navigator.setAppBadge(fresh.length); } catch {}
  const cl = await self.clients.matchAll();
  cl.forEach(x => x.postMessage({ notified: fresh.map(i => i.id) }));
}
self.addEventListener('periodicsync', e => { if (e.tag === 'check-listings') e.waitUntil(check().catch(() => {})); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || './';
  e.waitUntil(self.clients.openWindow(url));
});
