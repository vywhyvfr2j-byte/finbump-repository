/// FinBump service worker — silent auto-update.
// Network-first for navigations so users always get the latest index.html
// (which references the newest hashed JS/CSS bundles). Stale-while-revalidate
// for everything else so the app loads instantly offline and refreshes assets
// in the background. skipWaiting + clients.claim means a new SW activates the
// moment it's installed, and the client reloads once to pick up the new shell.

// Bumping this name matters: the activate handler below deletes every cache that
// isn't the current one, so a rename is also how caches written by an earlier
// version — which did store API responses — are dropped from existing browsers.
const CACHE = 'finbump-shell-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add('/').catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API traffic is never intercepted or cached. Entity and auth responses are
  // private to the signed-in user, and Cache Storage matches by URL only — it
  // ignores the request's Authorization header — so a cached copy would be
  // replayed to whoever signs in next on a shared browser. Let these go straight
  // to the network.
  if (url.pathname.startsWith('/api/') || req.headers.has('authorization')) return;

  // Navigations: network-first so the latest index.html (with new asset hashes)
  // is always served, falling back to cache when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate — serve from cache instantly,
  // fetch the latest in the background so the next load is up to date.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
