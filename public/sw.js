// Vyoma OTT Service Worker - Push Notifications, Offline App Shell & Offline Video Caching
const OFFLINE_APP_CACHE = 'vyoma-offline-app-v2';
const OFFLINE_VIDEO_CACHE = 'vyoma-offline-video-v1';

// 1. INSTALL: Pre-cache the standalone Offline Player application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_APP_CACHE).then((cache) => {
      return cache.addAll([
        '/offline.html',
        '/favicon.ico',
      ]).catch((err) => {
        console.warn('[SW] Offline app pre-cache failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Clean up stale caches while strictly keeping downloaded videos intact
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== OFFLINE_VIDEO_CACHE && key !== OFFLINE_APP_CACHE) {
            console.log('[SW] Deleting old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH INTERCEPTOR
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // A. BROWSER PAGE NAVIGATION (Offline Fallback Handler)
  // When user is in airplane mode or has no internet, serve offline.html instead of browser error
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Always try live network first when user navigates
          return await fetch(req);
        } catch (networkError) {
          // Network failed! Device has no internet / airplane mode.
          console.log('[SW] Navigation failed (offline). Serving Vyoma Offline Library.');
          const appCache = await caches.open(OFFLINE_APP_CACHE);
          const cachedShell = await appCache.match('/offline.html');
          if (cachedShell) {
            return cachedShell;
          }

          // Fallback direct HTML in case cache was cleared
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vyoma OTT - Offline</title></head><body style="background:#080c16;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>📶 Offline Mode</h2><p>You are offline. <a href="/offline.html" style="color:#f26422;font-weight:bold;">Open Offline Video Player &rarr;</a></p></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // B. STATIC OFFLINE ASSETS (offline.html or favicon)
  if (url.includes('/offline.html')) {
    event.respondWith(
      caches.open(OFFLINE_APP_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        return fetch(req);
      })
    );
    return;
  }

  // C. OFFLINE VIDEO FETCH INTERCEPTOR (YouTube-Style Offline Playback)
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

// 4. PUSH NOTIFICATION HANDLERS
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
