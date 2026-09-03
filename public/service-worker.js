// ---------------------------------------------------------------------------
// FitAnya Service Worker — egyszerű app-shell cache + stale-while-revalidate
// Ez egy induló, kézzel írt megoldás. Ha bővebb offline-stratégia kell
// (pl. runtime image cache, verziókövetés), érdemes a Workbox könyvtárra
// váltani — lásd a projekt README-jét.
// ---------------------------------------------------------------------------

const CACHE_VERSION = "fitanya-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Csak GET kéréseket cache-elünk, és csak azonos-origin erőforrásokat
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Navigációs kérések (oldalbetöltés): hálózat előbb, offline esetén app-shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Statikus erőforrások: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
