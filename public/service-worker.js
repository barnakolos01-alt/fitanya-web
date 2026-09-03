// ---------------------------------------------------------------------------
// FitAnya Service Worker — PWA Cache + Web Push Értesítési Rendszer
// ---------------------------------------------------------------------------

const CACHE_VERSION = "fitanya-v2";
const APP_SHELL = [
  "/",
  "/app",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// 1. INSTALL — App-shell letöltése
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 2. ACTIVATE — Régi cache törlése és azonnali átvétel
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

// 3. FETCH — Offline támogatás és gyors betöltés (stale-while-revalidate)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Navigáció: ha nincs net, jöhet a betöltött app-shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Statikus fájlok kiszolgálása
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

// ---------------------------------------------------------------------------
// 4. PUSH ÉRTESÍTÉSEK KEZELÉSE (ZÁRT KÉPERNYŐ ÉS HÁTTÉRFUTÁS)
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  let data = {
    title: "FitAnya Zsebedző 💧",
    body: "Itt az idő egy korty frissítő vízre! Töltsd újra a poharad.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: "/app",
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/app",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. KATTINTÁS AZ ÉRTESÍTÉSRE
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Ha már nyitva van a Zsebedző valamelyik fülön, csak előtérbe hozzuk
      for (const client of clientList) {
        if (client.url.includes("/app") && "focus" in client) {
          return client.focus();
        }
      }
      // Ha nincs nyitva, új ablakot/PWA felületet nyitunk
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
