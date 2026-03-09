// Service Worker — Manutencao Preventiva
// Bump CACHE_VERSION para forcar atualizacao em todos os dispositivos
var CACHE_VERSION = 'mp-v9-' + Date.now(); // timestamp garante cache unico
var CACHE_NAME = CACHE_VERSION;

var ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instala e faz cache dos assets
self.addEventListener('install', function(e) {
  self.skipWaiting(); // Assume controle imediatamente sem esperar reload
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('[SW] cache.addAll parcial:', err);
      });
    })
  );
});

// Apaga caches antigos ao ativar
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim(); // Assume controle de todos os clientes abertos
    })
  );
});

// Estrategia: Network First para JS/HTML, Cache First para imagens/fontes
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Ignora requests externos (Firebase, Google Fonts, etc)
  if (!url.startsWith(self.location.origin)) return;

  // Network First para paginas e scripts (sempre tenta atualizar)
  if (url.endsWith('.html') || url.endsWith('.js') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        return resp;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Cache First para imagens e outros assets estaticos
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        return resp;
      });
    })
  );
});
