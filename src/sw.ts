/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// 1. Precache app shell and build assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. Offline fallback for SPA Navigation
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/, /^\/malayalam quran mp3/, /\.[a-z0-9]+$/i]
});
registerRoute(navigationRoute);

// 3. Cache translations, scripture APIs, manifests, and JSON data with StaleWhileRevalidate
registerRoute(
  ({ url }) =>
    url.pathname.includes('/data/') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('alquran.cloud'),
  new StaleWhileRevalidate({
    cacheName: 'quran-data-v1'
  })
);

// 4. Cache Google Fonts stylesheets and webfonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache-v1'
  })
);

/**
 * Handle HTTP Range requests for cached audio.
 * Required for iOS Safari and mobile Chrome audio seeking when offline.
 */
async function handleAudioRequest(request: Request): Promise<Response> {
  const audioCache = await caches.open('quran-audio-v1');
  
  // Normalize URL to match cache key without headers
  const url = request.url;
  
  // Match cached response
  const cachedResponse = await audioCache.match(url);

  if (cachedResponse) {
    const rangeHeader = request.headers.get('range');

    // If client requested a partial range (e.g. bytes=0- or bytes=1048576-)
    if (rangeHeader) {
      try {
        const arrayBuffer = await cachedResponse.arrayBuffer();
        const total = arrayBuffer.byteLength;

        // Parse range: "bytes=start-end"
        const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (matches) {
          const rawStart = matches[1];
          const rawEnd = matches[2];

          let start = rawStart ? parseInt(rawStart, 10) : 0;
          let end = rawEnd ? parseInt(rawEnd, 10) : total - 1;

          if (isNaN(start)) start = 0;
          if (isNaN(end) || end >= total) end = total - 1;

          // Sliced buffer for partial response
          const slicedBuffer = arrayBuffer.slice(start, end + 1);

          return new Response(slicedBuffer, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
              'Content-Type': cachedResponse.headers.get('content-type') || 'audio/mpeg',
              'Content-Range': `bytes ${start}-${end}/${total}`,
              'Content-Length': String(slicedBuffer.byteLength),
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        }
      } catch (err) {
        console.error('[SW] Range slicing failed, returning full cached response:', err);
      }
    }

    // Return full response if no Range header or fallback
    return cachedResponse.clone();
  }

  // Not in cache: Attempt network fetch if online
  try {
    const networkResponse = await fetch(request);

    // Auto-cache streamed audio (Surahs and Ayahs) so once heard, it NEVER needs network fetch again!
    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
      const cacheCopy = networkResponse.clone();
      audioCache.put(url, cacheCopy).catch(err => {
        console.warn('[SW] Auto-caching audio failed:', err);
      });
    } else if (networkResponse && networkResponse.status === 206) {
      // If server returned partial content (206) due to Range header, background-fetch full audio
      // without Range header to permanently cache the complete file in CacheStorage
      fetch(url)
        .then(fullRes => {
          if (fullRes.status === 200) {
            return audioCache.put(url, fullRes);
          }
        })
        .catch(() => {});
    }

    return networkResponse;
  } catch (err) {
    // Offline and not cached
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This audio is not yet cached or downloaded for offline listening. Connect to the internet once to play and auto-cache it.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable (Offline)',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 5. Intercept audio requests (Cloudflare R2, EveryAyah, IslamicNetwork, local mp3s, or any audio file)
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === 'audio' ||
      url.pathname.endsWith('.mp3') ||
      url.pathname.includes('/audio/') ||
      url.hostname.includes('r2.dev') ||
      url.hostname.includes('everyayah.com') ||
      url.hostname.includes('islamic.network') ||
      url.pathname.includes('malayalam quran mp3')
    );
  },
  async ({ request }) => {
    return handleAudioRequest(request);
  }
);

// 6. Handle update prompts and message passing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
