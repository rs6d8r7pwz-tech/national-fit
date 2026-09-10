const CACHE_NAME = 'nationalfit-v1';
const OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  // Skip API / function calls
  if (event.request.url.includes('/api/') || event.request.url.includes('/functions/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && event.request.url.includes('/assets/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request) || caches.match('/') || new Response('Offline', { status: 503 });
      })
  );
});

// --- Rappels : rendre les notifications cliquables ---
// Un clic sur un rappel ré-ouvre (ou focus) l'app plutôt que de ne rien faire.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});

// --- Prêt pour un futur serveur push (VAPID) ---
// Sans serveur push configuré, cet écouteur reste inactif ; il permet
// d'ajouter plus tard de vrais rappels "app fermée" sans retoucher le SW.
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
  const title = payload.title || 'National Fit';
  const options = {
    body: payload.body || 'Ta séance t\'attend 💪',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.tag || 'nfit-push',
    renotify: true,
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
