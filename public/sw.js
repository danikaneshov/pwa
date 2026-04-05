const CACHE_NAME = 'damdym-v1';
const ASSETS = [ '/', '/index.html', '/manifest.json' ];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
    // Не кэшируем API запросы к бэкенду
    if (e.request.url.includes('/api/')) return;
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
