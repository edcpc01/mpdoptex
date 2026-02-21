const CACHE_NAME = 'mp-preventiva-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600&display=swap'
];

// ── Install: cache all assets ─────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for assets, network-first for Firebase ─────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network for Firebase / external APIs
  if (url.hostname.includes('firebase') || url.hostname.includes('google') && url.pathname.includes('/v1/')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Manutenção Preventiva';
  const options = {
    body: data.body || 'Há manutenções que precisam de atenção.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'mp-alert',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open',    title: 'Ver agora' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const c = cls.find(c => c.url.includes(self.location.origin));
      if (c) return c.focus();
      return clients.openWindow(e.notification.data.url || '/');
    })
  );
});

// ── Background Sync: check upcoming maintenance ───────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-maintenance') {
    e.waitUntil(checkMaintenanceAlerts());
  }
});

async function checkMaintenanceAlerts() {
  // Fires daily background check — main app handles the actual notification logic
  const clients_list = await clients.matchAll();
  if (clients_list.length === 0) {
    // App not open — show a reminder notification
    await self.registration.showNotification('Manutenção Preventiva', {
      body: 'Verifique o cronograma de manutenções preventivas.',
      icon: '/icons/icon-192.png',
      tag: 'daily-reminder'
    });
  }
}
