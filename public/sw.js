// by trup40 (Eagle) 
// https://github.com/trup40/NodeTube
// 2026

const CACHE_NAME = 'nodetube-v3.0-cache'; 

const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/nodetube.js',
    '/i18n.js',
    '/favicon.svg',
    '/icon-192.png',
    '/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || 
        e.request.url.includes('/stream') || 
        e.request.url.includes('/search') || 
        e.request.url.includes('/resolve') || 
        e.request.url.includes('lrclib.net')) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});