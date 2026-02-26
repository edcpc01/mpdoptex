// =============================================================================
//  SERVICE WORKER — Manutencao Preventiva
//  Estrategia: Network-First para HTML/JS (sempre atualiza),
//              Cache-First apenas para fontes e icones estaticos.
// =============================================================================

const CACHE_VERSION = 'mp-vef73a45c';
const CACHE_STATIC  = CACHE_VERSION + '-static';
const CACHE_APP     = CACHE_VERSION + '-app';

const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json'
];

// Install — pre-cache apenas assets estaticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove TODOS os caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_STATIC && k !== CACHE_APP)
            .map(k => { console.log('[SW] cache antigo removido:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase / APIs externas — nunca cacheia
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('api.qrserver.com') ||
    url.hostname.includes('jsdelivr.net')
  ) return;

  // HTML e JS — Network-First (sempre pega versao nova)
  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js')) {
    e.respondWith(networkFirst(e.request, CACHE_APP));
    return;
  }

  // Fontes e icones — Cache-First
  if (
    url.hostname.includes('fonts.g') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ) {
    e.respondWith(cacheFirst(e.request, CACHE_STATIC));
    return;
  }

  // Resto — Network-First
  e.respondWith(networkFirst(e.request, CACHE_APP));
});

async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res && res.status === 200 && res.type !== 'opaque') {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch(err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('/index.html');
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch(err) { throw err; }
}

// Mensagens da pagina
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'CLEAR_CACHE')
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
});

// Push Notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(
    data.title || 'Manutencao Preventiva', {
      body:     data.body || 'Ha manutencoes que precisam de atencao.',
      icon:     '/icons/icon-192.png',
      badge:    '/icons/icon-192.png',
      tag:      data.tag || 'mp-alert',
      renotify: true,
      data:     { url: data.url || '/' },
      actions:  [{ action:'open', title:'Ver agora' }, { action:'dismiss', title:'Dispensar' }]
    }
  ));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(cls => {
      const c = cls.find(c => c.url.includes(self.location.origin));
      if (c) return c.focus();
      return clients.openWindow(e.notification.data.url || '/');
    })
  );
});
