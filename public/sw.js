// Vyoma OTT Service Worker - Push Notifications & Offline Video Caching
const OFFLINE_VIDEO_CACHE = 'vyoma-offline-video-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 📥 OFFLINE VIDEO FETCH INTERCEPTOR (YouTube-Style Offline Playback)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(OFFLINE_VIDEO_CACHE);
        const cachedResponse = (await cache.match(url)) || (await cache.match(req));

        if (cachedResponse) {
          // HTML5 Video Range request handling (Range: bytes=start-end)
          const rangeHeader = req.headers.get('range');
          if (rangeHeader && cachedResponse.status === 200) {
            const blob = await cachedResponse.blob();
            const bytes = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(bytes[0], 10) || 0;
            const end = bytes[1] ? parseInt(bytes[1], 10) : blob.size - 1;

            const chunk = blob.slice(start, end + 1);
            return new Response(chunk, {
              status: 206,
              statusText: 'Partial Content',
              headers: {
                'Content-Range': `bytes ${start}-${end}/${blob.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(chunk.size),
                'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4',
              },
            });
          }
          return cachedResponse;
        }

        // If not in cache, attempt network fetch
        return await fetch(req);
      } catch (networkErr) {
        // Network failed (Device is offline / airplane mode / no internet)
        // Fallback: Check offline cache again
        try {
          const cache = await caches.open(OFFLINE_VIDEO_CACHE);
          const fallback = (await cache.match(url)) || (await cache.match(req));
          if (fallback) return fallback;
        } catch (e) {}

        throw networkErr;
      }
    })()
  );
});

// 🔔 PUSH NOTIFICATION HANDLERS
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
      actions: [{ action: 'explore', title: 'Open Vyoma OTT' }],
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
