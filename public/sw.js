const CACHE_NAME = 'vyoma-offline-v2';
const VIDEO_CACHE = 'vyoma-offline-video-v1';

// The install handler takes care of precaching basic framework assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/globals.css',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== VIDEO_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

// Fetch handler to serve cached files if offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // If it is a video asset, try resolving it immediately with Cache-First Range Support
  if (request.destination === 'video' || request.url.includes('.mp4')) {
     event.respondWith(
       caches.open(VIDEO_CACHE).then((cache) => {
         return cache.match(request).then((response) => {
           if (response) {
             console.log('[ServiceWorker] Serving video from offline cache with Range interception:', request.url);
             return handleRangeRequest(request, response);
           }
           // Otherwise fallback to standard network pipeline
           return fetch(request).catch(() => {
             // Critical offline fallback
             return new Response('Offline content unavailable.', { status: 503 });
           });
         });
       })
     );
     return; // Exit listener early for special video pipeline
  }

  // Standard dynamic pipeline for non-video elements: Network-First strategy
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache the new response for future offline use if it is a successful GET request
        if (request.method === 'GET' && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response('Offline content unavailable.', { status: 503 });
        });
      })
  );
});

/**
 * Enterprise Offline Video Bridge:
 * Simulates HTTP 206 Partial Content delivery dynamically from cached Blobs.
 * Needed because browser video engines strictly demand Range headers for seeking & loading!
 */
async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  
  // Standard load if no HTTP Range headers are present
  if (!rangeHeader) {
    return cachedResponse;
  }

  try {
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const match = rangeHeader.match(/^bytes=(\d+)-(\d+)?$/);
    
    if (!match) {
      return cachedResponse;
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : arrayBuffer.byteLength - 1;
    const chunk = arrayBuffer.slice(start, end + 1);

    // Return high-fidelity 206 partial segment so player can stream seamlessly!
    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: new Headers({
        'Content-Type': cachedResponse.headers.get('content-type') || 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
        'Content-Length': String(chunk.byteLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache'
      }),
    });
  } catch (error) {
    console.error('[ServiceWorker] Offline Range Construction Error:', error);
    return cachedResponse; // Hard fallback
  }
}

