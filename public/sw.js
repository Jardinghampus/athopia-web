// Athopia Service Worker — PWA + Push Notifications
const CACHE_NAME = "athopia-v1";
const OFFLINE_URL = "/";

// Statiska resurser att cache:a
const PRECACHE_URLS = ["/", "/nyheter", "/statistik", "/manifest.json"];

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch — Network First med cache-fallback ──────────────────────────────────

self.addEventListener("fetch", (event) => {
  // Ignorera non-GET och API-anrop
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache endast lyckade HTML-svar
        if (response.ok && event.request.destination === "document") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached ?? caches.match(OFFLINE_URL)),
      ),
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Athopia", body: event.data.text() };
  }

  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: data.tag ?? "athopia-news",
    renotify: true,
    data: { url: data.url ?? "/" },
    actions: [{ action: "open", title: "Läs mer" }],
  };

  event.waitUntil(self.registration.showNotification(data.title ?? "Athopia", options));
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url === url && "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
