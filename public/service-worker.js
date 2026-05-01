const CACHE_NAME = 'hostel-gatepass-v2';
const STATIC_ASSETS = [
  '/styles.css',
  '/app.js',
  '/dashboard.js',
  '/manifest.json',
  '/assets/go.png',
  '/assets/return.png',
  '/assets/stay.png',
  '/assets/reason.png',
  '/assets/approval_remark.png',
];

self.addEventListener('install', event => {
  // Pre-cache only truly static assets (no HTML pages)
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  // Do NOT call skipWaiting() — prevents forced mid-session reload
});

self.addEventListener('activate', event => {
  // Clean up old caches only
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
    // Do NOT call clients.claim() — prevents takeover of already-loaded pages
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always network-first for API calls — never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ message: 'Offline - no connection' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Always network-first for HTML pages — never serve stale HTML from cache
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for JS/CSS (get latest, fall back to cache if offline)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for images and other static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
