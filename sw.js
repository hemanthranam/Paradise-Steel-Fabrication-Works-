/**
 * Lightweight Service Worker for Paradise Steel Fabrication Works
 * Pre-caches shell pages and provides offline.html fallback
 */
const CACHE_NAME = 'psfw-v2-cache';
const STATIC_ASSETS = [
  './',
  './index.html',
  './speed-lift-250.html',
  './speed-lift-500.html',
  './capabilities.html',
  './about.html',
  './services.html',
  './projects.html',
  './contact.html',
  './quote.html',
  './offline.html',
  './css/style.css',
  './js/app.js',
  './assets/images/logo-horse.svg',
  './favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
        });
      })
  );
});
