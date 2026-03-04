// SERVICE WORKER — Manutencao Preventiva
// Versao: 6efdaf91
// Regra de ouro: NUNCA intercepta requisicoes externas (Firebase, gstatic, etc.)
// Apenas arquivos do proprio dominio sao cacheados.

const CACHE = 'mp-v6efdaf98';

// Install: cacheia os arquivos do app para funcionar offline
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/index.html', '/app.js', '/manifest.json']))
      .then(() => self.skipWaiting())
  );
});

// Activate: apaga caches antigos e assume controle imediatamente
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-First APENAS para arquivos do proprio dominio
// Qualquer outra origem (Firebase, gstatic, googleapis...) passa DIRETO sem interceptar
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // So intercepta GET do proprio dominio
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-First: tenta rede primeiro, cache como fallback offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('/index.html')))
  );
});

// Mensagem para forcar atualizacao via banner
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
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(cls => {
        const c = cls.find(c => c.url.includes(self.location.origin));
        if (c) return c.focus();
        return clients.openWindow('/');
      })
  );
});
