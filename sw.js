const CACHE_NAME = 'offline-support-v1';

self.addEventListener('install', event => {
  // Runs on first install, or when the browser detects a changed sw.js file.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Runs after installation; remove old caches and take control of open pages.
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  console.log('message', event);
  if (event.data?.type !== 'CACHE_PAGES' || !Array.isArray(event.data.urls)) return;

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(event.data.urls.map(async value => {
      try {
        const url = new URL(value, self.location.origin);
        if (url.origin !== self.location.origin) return;

        const response = await fetch(url.href);
        if (response.ok) {
          await cache.put(url.href, response.clone());
        }
      } catch (error) {
        console.error('Could not cache resource:', value, error);
      }
    }));
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  console.log('fetching', url, request);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Keep the audio app immediately available, even when offline.
    if (request.mode === 'navigate' && /(^|\/)audio\.html$/.test(url.pathname)) {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        console.error('Could not fetch audio.html:', request, error);
        return new Response('audio.html is not available offline yet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }

    // For other requests, prefer a fresh network response and fall back to cache.
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      console.error('Could not fetch:', request, error);
      const cached = await cache.match(request);
      if (cached) return cached;
      return new Response('This resource is not available offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());

});
