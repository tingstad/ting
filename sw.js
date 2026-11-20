const CACHE_NAME = 'offline-support-v5';
const FALLBACK_CACHE_NAME = 'offline-support-fallback';

function getCacheVersion(cacheName) {
  const match = cacheName.match(/-v0*(\d+)$/);
  return match ? String(Number(match[1])) : '?';
}

function isAudioHtml(url) {
  return new URL(url, self.location.origin).pathname.endsWith('/audio.html');
}

async function versionAudioHtml(response, { htmlVersion, swVersion } = {}) {
  let html = await response.text();
  if (htmlVersion) {
    html = html.replace(/(<!--cached-version-->)[^<]*(<)/, `$1${htmlVersion}$2`);
  }
  if (swVersion) {
    html = html.replace(/(<!--sw-version-->)[^<]*(<)/, `$1${swVersion}$2`);
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('install', event => {
  // Runs on first install, or when the browser detects a changed sw.js file.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Preserve old app resources as a last-resort offline fallback.
  event.waitUntil((async () => {
    const fallbackCache = await caches.open(FALLBACK_CACHE_NAME);
    for (const name of (await caches.keys()).filter(name =>
      name.startsWith('offline-support-') && name !== CACHE_NAME && name !== FALLBACK_CACHE_NAME
    )) {
      const oldCache = await caches.open(name);
      for (const request of await oldCache.keys()) {
        const response = await oldCache.match(request);
        const fallbackResponse = isAudioHtml(request.url)
          ? await versionAudioHtml(response, { htmlVersion: getCacheVersion(name) })
          : response;
        await fallbackCache.put(request, fallbackResponse);
      }
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
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
          const cacheResponse = isAudioHtml(url.href)
            ? await versionAudioHtml(response, { htmlVersion: getCacheVersion(CACHE_NAME) })
            : response.clone();
          await cache.put(url.href, cacheResponse);
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
      if (cached) return versionAudioHtml(cached, { swVersion: getCacheVersion(CACHE_NAME) });

      try {
        const response = await fetch(request);
        if (!response.ok) return response;
        const cacheResponse = await versionAudioHtml(response, { htmlVersion: getCacheVersion(CACHE_NAME) });
        await cache.put(request, cacheResponse.clone());
        return versionAudioHtml(cacheResponse, { swVersion: getCacheVersion(CACHE_NAME) });
      } catch (error) {
        console.error('Could not fetch audio.html:', request, error);
        const fallbackCache = await caches.open(FALLBACK_CACHE_NAME);
        const fallbackCached = await fallbackCache.match(request);
        if (fallbackCached) return versionAudioHtml(fallbackCached, { swVersion: getCacheVersion(CACHE_NAME) });
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
      const fallbackCache = await caches.open(FALLBACK_CACHE_NAME);
      const fallbackCached = await fallbackCache.match(request);
      if (fallbackCached) return fallbackCached;
      return new Response('This resource is not available offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());

});
