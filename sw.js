/* NODO ART — Service Worker v1.0 */
const CACHE_NAME = 'nodoart-v1';
const OFFLINE_URL = '/nodo-cultural-zacatecas/';

/* Cache on install */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Network first, cache fallback */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match(OFFLINE_URL)))
  );
});

/* Push notifications */
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'NODO ART';
  const opts = {
    body: data.body || 'Tienes un nuevo mensaje',
    icon: data.icon || '/nodo-cultural-zacatecas/icon-192.png',
    badge: '/nodo-cultural-zacatecas/icon-72.png',
    tag: data.tag || 'nodo-msg',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/nodo-cultural-zacatecas/' },
    actions: [
      { action: 'open', title: 'Ver mensaje' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

/* Notification click */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = (e.notification.data && e.notification.data.url) || '/nodo-cultural-zacatecas/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const win = cls.find(c => c.url.includes('nodoart.mx') || c.url.includes('github.io'));
      if (win) { win.focus(); win.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

/* Background sync for chat messages */
self.addEventListener('sync', e => {
  if (e.tag === 'sync-messages') {
    console.log('SW: syncing pending messages');
  }
});
