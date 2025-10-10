// Enhanced Service Worker for MCNmart - Performance Optimized
const CACHE_VERSION = '1.0.5';
const CACHE_NAME = `mcnmart-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `mcnmart-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `mcnmart-dynamic-v${CACHE_VERSION}`;
const API_CACHE_NAME = `mcnmart-api-v${CACHE_VERSION}`;

// URLs to cache immediately - only existing assets
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Enhanced caching strategy with 404 handling
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);
  
  // Skip external URLs that cause CORS issues
  if (!url.origin.includes('localhost') && !url.origin.includes('127.0.0.1') && url.hostname !== location.hostname) {
    return;
  }
  
  // Skip service worker registration requests
  if (url.pathname.includes('sw.js')) {
    return;
  }
  
  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request.clone())
        .then(response => {
          if (response.ok && response.status < 400) {
            // Clone response immediately before any consumption
            const responseToCache = response.clone();
            const responseToReturn = response.clone();
            
            // Cache asynchronously without blocking
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(event.request.clone(), responseToCache))
              .catch(err => console.warn('API cache put failed:', err));
            
            return responseToReturn;
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Static assets - Cache first with fallback to network, handle 404s gracefully
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          
          return fetch(event.request.clone())
            .then(response => {
              if (response.ok && response.status < 400) {
                // Clone response immediately before any consumption
                const responseToCache = response.clone();
                const responseToReturn = response.clone();
                
                // Cache asynchronously without blocking
                caches.open(STATIC_CACHE_NAME)
                  .then(cache => cache.put(event.request.clone(), responseToCache))
                  .catch(err => console.warn('Static cache put failed:', err));
                
                return responseToReturn;
              }
              
              // Handle 404s gracefully for webpack chunks
              if (url.pathname.includes('webpack') || url.pathname.includes('vendor') || url.pathname.includes('common')) {
                console.log('Webpack chunk not found, serving fallback:', url.pathname);
                return new Response('', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
              }
              
              return response;
            })
            .catch(err => {
              console.warn('Static asset fetch failed:', err);
              
              // For critical webpack chunks, return empty response instead of 404
              if (url.pathname.includes('webpack') || url.pathname.includes('vendor') || url.pathname.includes('common')) {
                console.log('Serving empty response for missing webpack chunk');
                return new Response('', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
              }
              
              // For other assets, return offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Pages - Stale while revalidate with 404 handling
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        const fetchPromise = fetch(event.request.clone())
          .then(response => {
            if (response.ok && response.status < 400) {
              // Clone response immediately before any consumption
              const responseToCache = response.clone();
              const responseToReturn = response.clone();
              
              // Cache asynchronously without blocking
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => cache.put(event.request.clone(), responseToCache))
                .catch(err => console.warn('Dynamic cache put failed:', err));
              
              return responseToReturn;
            }
            
            // Handle 404s for pages
            if (response.status === 404) {
              console.log('Page not found, serving offline page');
              return caches.match('/offline.html') || new Response('Page not available', { status: 404 });
            }
            
            return response;
          })
          .catch(err => {
            console.warn('Page fetch failed:', err);
            return caches.match('/offline.html') || new Response('Page not available', { status: 404 });
          });
        
        return response || fetchPromise;
      })
  );
});

console.log('🎉 MCNmart Service Worker loaded successfully');
console.log('🚀 Ready for enhanced performance!');
