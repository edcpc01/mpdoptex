// SERVICE WORKER — Manutencao Preventiva v73196c49
// Estrategia minima: cacheia apenas offline fallback.
// HTML e JS sempre vem da rede (nunca travamos atualizacoes).

const CACHE_NAME = 'mp-v73196c49';

// Install: cacheia apenas o fallback offline
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(['/index.html', '/app.js', '/manifest.json']))
      .then(() => self.skipWaiting())
  );
});

// Activate: apaga todos os caches antigos imediatamente
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-First para tudo.
// Se offline, serve do cache. Nunca intercepta Firebase/APIs externas.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Deixa passar SEM interceptar: Firebase, APIs externas, chrome-extension
  if (
    e.request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.hostname !== self.location.hostname
  ) return;

  // Para arquivos do proprio app: Network-First
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza cache com versao nova
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Offline: serve do cache
        return caches.match(e.request)
          .then(cached => cached || caches.match('/index.html'));
      })
  );
});

// Mensagem para forcar atualizacao
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
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
      data:     { url: data.url || '/' }
    }
  ));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true })
      .then(cls => {
        const c = cls.find(c => c.url.includes(self.location.origin));
        if (c) return c.focus();
        return clients.openWindow('/');
      })
  );
});
