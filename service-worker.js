const CACHE_NAME = 'nanoedit-v6-stable';
// Only cache purely static assets that rarely change
const STATIC_ASSETS = [
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NETWORK ONLY for:
  // 1. .tsx/.ts files (Source code changing often)
  // 2. index.html (App shell entry point)
  // 3. APIs and CDNs
  if (
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('index.html') ||
    url.href.endsWith('/') || // Root
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('cdn.tailwindcss.com')
  ) {
    // Return result from network, fallback to offline page if needed (not implemented here for simplicity)
    return; 
  }

  // STALE-WHILE-REVALIDATE for cached assets (icon, manifest)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});