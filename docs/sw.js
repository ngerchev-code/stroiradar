// СтройРадар — service worker: офлайн, известия, проверка във фона
const V = 'bb-v7';
const SHELL = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/badge-96.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'sr-prefs').map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/data/')) {
    // Данни: първо мрежа, после кеш
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(u.pathname, c)); return r; })
      .catch(() => caches.match(u.pathname)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});

// Проверка за нови обяви във фона (Android Chrome, инсталирано приложение)
async function check() {
  const c = await caches.open('sr-prefs');
  const pr = await c.match('prefs');
  const p = pr ? await pr.json() : { keywords: [], notifKw: false, notifWanted: false, disabled: [], ack: Date.now(), notified: [] };
  const r = await fetch('data/listings.json?t=' + Date.now(), { cache: 'no-store' });
  const { items = [] } = await r.json();
  const kw = (p.keywords || []).map(k => k.toLowerCase());
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
      body: `${it.title}${it.price ? '\n💰 ' + it.price : ''}`, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
      image: it.photo || undefined, tag: it.id, data: { url: it.url }, vibrate: [200, 100, 200]
    });
  }
  if (fresh.length > 4) await self.registration.showNotification(`🔔 Още ${fresh.length - 4} нови обяви`, { icon: 'icons/icon-192.png', tag: 'more', data: { url: './' } });
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
