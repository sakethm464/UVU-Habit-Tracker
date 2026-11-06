/* UVU service worker. Served at /service-worker.js (required by Pusher Beams).
 *
 * 1. Pusher Beams worker: handles web push display + click handling.
 * 2. Minimal offline support: static assets are cached (cache-first); page navigations always
 *    go to the network and fall back to /offline.html when offline. Authenticated HTML and
 *    API responses are never cached.
 */
importScripts("https://js.pusher.com/beams/service-worker.js");

const VERSION = "v2";
// On localhost (dev server) never cache: dev chunk URLs aren't content-hashed, so cache-first
// would serve stale JavaScript after every code change and cause hydration errors.
const IS_LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);
const STATIC_CACHE = `uvu-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("uvu-static-") && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || IS_LOCAL) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: network only, offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Immutable build assets and icons: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
  // Everything else (API, data, RSC payloads): default network behavior.
});
