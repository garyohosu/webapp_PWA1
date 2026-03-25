// Service Worker - App Shellキャッシュ戦略
const VERSION = 'v1.0.5';
const CACHE_NAME = 'pwa-cache-v5';

// インストール時：App Shellをキャッシュ
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', VERSION);
  const base = self.registration.scope;
  const APP_SHELL = [
    base,
    base + 'manifest.webmanifest',
  ];
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('Service Worker: App shell cached');
      })
  );
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// フェッチ時：Cache Firstストラテジー
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match(self.registration.scope);
            }
          });
      })
  );
});

// メッセージイベント：SKIP_WAITING対応
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
