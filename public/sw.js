/* GüneşOS Service Worker
 * Stratejiler:
 * - HTML navigations: NetworkFirst (3s timeout) → cache → offline.html
 * - Static assets (JS/CSS): StaleWhileRevalidate
 * - Images/fonts: CacheFirst (60 gün)
 *
 * Önemli: WebAPK üretiminin sağlam olması için bu SW, kayıt edildiği
 * scope ile uyumlu bir path'ten servis edilmelidir.
 * Örn: /gunesos/sw.js  → register('/gunesos/sw.js', { scope: '/gunesos/' })
 */
const VERSION = "v1.0.6";
const PRECACHE = `gunesos-precache-${VERSION}`;
const RUNTIME_HTML = `gunesos-html-${VERSION}`;
const RUNTIME_ASSETS = `gunesos-assets-${VERSION}`;
const RUNTIME_IMG = `gunesos-img-${VERSION}`;

// Scope-aware: SW served from /<base>/sw.js, registration.scope is /<base>/
const SCOPE = new URL(self.registration.scope).pathname; // ör. "/gunesos/" veya "/"

// CRITICAL: offline.html ve manifest.json'ın bu yollarda gerçekten yayında
// olduğundan emin ol. Yoksa addAll() patlar, SW install fail eder ve
// Chrome WebAPK üretmez → uygulama "ana ekrana kısayol" olarak düşer.
const PRECACHE_URLS = [SCOPE, `${SCOPE}offline.html`, `${SCOPE}manifest.json`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // addAll yerine tek tek ekle: bir dosya 404 dönerse SW yine de
      // aktive olabilsin (install kriterini koruruz).
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res && res.ok) await cache.put(url, res.clone());
          } catch (e) {
            // Sessizce geç — install fail etmesin
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![PRECACHE, RUNTIME_HTML, RUNTIME_ASSETS, RUNTIME_IMG].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isImage = (req) =>
  req.destination === "image" ||
  /\.(png|jpg|jpeg|gif|webp|svg|avif|ico)$/i.test(new URL(req.url).pathname);
const isFont = (req) =>
  req.destination === "font" || /\.(woff2?|ttf|otf|eot)$/i.test(new URL(req.url).pathname);
const isAsset = (req) =>
  ["script", "style", "worker"].includes(req.destination) ||
  /\.(js|mjs|css)$/i.test(new URL(req.url).pathname);

async function networkFirst(request, cacheName, timeoutMs = 3000) {
  const cache = await caches.open(cacheName);
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
    ]);
    if (network && network.ok) cache.put(request, network.clone());
    return network;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await caches.match(`${SCOPE}offline.html`);
      if (offline) return offline;
    }
    throw e;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function cacheFirst(request, cacheName, maxAgeDays = 60) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const dateHeader = cached.headers.get("date");
    if (dateHeader) {
      const age = (Date.now() - new Date(dateHeader).getTime()) / 86400000;
      if (age < maxAgeDays) return cached;
    } else {
      return cached;
    }
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, RUNTIME_HTML, 3000));
    return;
  }
  if (isImage(req) || isFont(req)) {
    event.respondWith(cacheFirst(req, RUNTIME_IMG, 60));
    return;
  }
  if (isAsset(req)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_ASSETS));
    return;
  }
});
