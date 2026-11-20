// Vyoma OTT Service Worker - Push Notifications, Offline App Shell & Offline Video Caching
const OFFLINE_APP_CACHE = 'vyoma-offline-app-v7';
const OFFLINE_VIDEO_CACHE = 'vyoma-offline-video-v1';

// 1. INSTALL: Pre-cache the standalone Offline Player application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_APP_CACHE).then((cache) => {
      return cache.addAll([
        '/offline.html',
        '/offline',
        '/favicon.ico',
      ]).catch((err) => {
        console.warn('[SW] Offline app pre-cache warning:', err);
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

// 3. FETCH INTERCEPTOR (Ultra-Fast Zero-Latency Offline Delivery)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // A. INSTANT CACHE-FIRST FOR OFFLINE PAGES (/offline, /offline.html, and Next.js RSC requests)
  // When user clicks Offline Library, serve immediately in 0ms without waiting for network!
  if (url.includes('/offline.html') || url.includes('/offline')) {
    event.respondWith(
      (async () => {
        const appCache = await caches.open(OFFLINE_APP_CACHE);
        const cached = (await appCache.match(url)) || (await appCache.match('/offline.html')) || (await appCache.match('/offline'));
        if (cached) {
          return cached;
        }

        // If not in cache and online, fetch from network and cache for next time
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200) {
            appCache.put(url, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch (err) {
          // Fallback to offline.html
          const fallback = await appCache.match('/offline.html');
          if (fallback) return fallback;
          return new Response('Offline Library Ready', { status: 200, headers: { 'Content-Type': 'text/html' } });
        }
      })()
    );
    return;
  }

  // B. BROWSER PAGE NAVIGATION (Offline Fallback with Instant 0ms Offline Detection & Fast-Race)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const reqUrl = new URL(req.url);
        const isReconnect = reqUrl.searchParams.has('reconnect') || reqUrl.searchParams.has('force');

        // 1. Instant check: If device is reported offline AND this is NOT an explicit reconnect attempt,
        // return offline.html IMMEDIATELY (0ms delay)
        if (!isReconnect && typeof self.navigator !== 'undefined' && self.navigator.onLine === false) {
          const appCache = await caches.open(OFFLINE_APP_CACHE);
          const cachedShell = await appCache.match('/offline.html');
          if (cachedShell) return cachedShell;
        }

        // 2. If online or reconnecting, fetch from network.
        // We race with a 4-second timeout to handle blackholed/dead TCP connections gracefully
        // while allowing live Next.js SSR / cold-starts to load the real homepage cleanly.
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('NetworkTimeout')), 4000);
          });
          const networkPromise = fetch(req);

          const response = await Promise.race([networkPromise, timeoutPromise]);
          if (response && (response.ok || response.status < 400)) {
            return response;
          }
          return response;
        } catch (networkError) {
          // Network failed or timed out! Serve Vyoma Offline Library fallback
          console.log('[SW] Network unreachable. Serving instant offline fallback shell.');
          const appCache = await caches.open(OFFLINE_APP_CACHE);
          const cachedShell = await appCache.match('/offline.html');
          if (cachedShell) {
            return cachedShell;
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vyoma OTT - Offline</title></head><body style="background:#080c16;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>📶 Offline Mode</h2><p><a href="/offline.html" style="color:#f26422;font-weight:bold;">Open Offline Video Player &rarr;</a></p></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // C. OFFLINE VIDEO FETCH INTERCEPTOR (YouTube-Style Offline Playback)
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(OFFLINE_VIDEO_CACHE);
        let cachedResponse = (await cache.match(url)) || (await cache.match(req));

        if (!cachedResponse) {
          const keys = await cache.keys();
          const decodedTarget = decodeURIComponent(url);
          const encodedTarget = encodeURI(decodedTarget);
          const urlFilename = decodedTarget.split('/').pop()?.split('?')[0] || '';

          const matchKey = keys.find(k => {
            const kUrl = k.url;
            if (kUrl === url || kUrl === decodedTarget || kUrl === encodedTarget) return true;
            if (decodeURIComponent(kUrl) === decodedTarget) return true;
            if (urlFilename && urlFilename.length > 3 && decodeURIComponent(kUrl).includes(urlFilename)) return true;
            return false;
          });
          if (matchKey) cachedResponse = await cache.match(matchKey);
        }

        if (cachedResponse) {
          const rawMime = cachedResponse.headers.get('Content-Type');
          const mimeType = (rawMime && rawMime.includes('/')) ? rawMime : (url.endsWith('.m4a') ? 'audio/mp4' : 'video/mp4');

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
                'Content-Type': mimeType,
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
          let fallback = (await cache.match(url)) || (await cache.match(req));
          if (!fallback) {
            const keys = await cache.keys();
            const decodedTarget = decodeURIComponent(url);
            const urlFilename = decodedTarget.split('/').pop()?.split('?')[0] || '';
            const matchKey = keys.find(k => {
              const kUrl = k.url;
              return kUrl === url || decodeURIComponent(kUrl) === decodedTarget || (urlFilename && urlFilename.length > 3 && decodeURIComponent(kUrl).includes(urlFilename));
            });
            if (matchKey) fallback = await cache.match(matchKey);
          }
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
