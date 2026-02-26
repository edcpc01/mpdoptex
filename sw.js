// SW DESATIVADO — desregistra a si mesmo e limpa todos os caches
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_DEACTIVATED' })))
      .then(() => self.registration.unregister())
  );
});
