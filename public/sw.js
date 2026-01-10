const CACHE_NAME = 'complyflow-v1.2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.jpeg',
    '/screenshot1.jpeg',
    '/screenshot2.jpeg',
    '/vite.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
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

    // Skip interception for:
    // 1. Vite internal paths (Hot Module Replacement)
    // 2. Source files during development
    // 3. Supabase / External APIs
    // 4. Chrome extensions or other non-http(s) schemes
    // 5. Any non-GET requests
    // 6. node_modules
    if (
        url.pathname.startsWith('/@vite') ||
        url.pathname.startsWith('/@react-refresh') ||
        url.pathname.startsWith('/src/') ||
        url.pathname.startsWith('/node_modules/') ||
        url.pathname.includes('.tsx') ||
        url.pathname.includes('.ts') ||
        url.pathname.includes('.jsx') ||
        url.pathname.includes('.js?') ||
        url.hostname.includes('supabase.co') ||
        url.hostname !== self.location.hostname ||
        !url.protocol.startsWith('http') ||
        event.request.method !== 'GET'
    ) {
        // Don't intercept - let the browser handle it normally
        return;
    }

    // Only cache static assets, not dynamic content
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            // If not in cache, fetch from network
            return fetch(event.request).then((networkResponse) => {
                return networkResponse;
            }).catch((error) => {
                console.warn('SW fetch failed:', error);
                // Return a simple offline response instead of undefined
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});

