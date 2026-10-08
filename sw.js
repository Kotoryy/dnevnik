// Сгенерировано build-web.js. Версия меняется при каждом изменении файлов.
const CACHE = "dnevnik-e23e26c4c1b2";
const ASSETS = ["./","index.html","web-bridge.js","manifest.webmanifest","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-512-full.png","fonts/onest/400.css","fonts/onest/files/onest-cyrillic-400-normal.woff2","fonts/onest/files/onest-cyrillic-ext-400-normal.woff2","fonts/onest/files/onest-latin-400-normal.woff2","fonts/onest/files/onest-latin-ext-400-normal.woff2","fonts/onest/files/onest-math-400-normal.woff2","fonts/onest/files/onest-symbols-400-normal.woff2","fonts/onest/500.css","fonts/onest/files/onest-cyrillic-500-normal.woff2","fonts/onest/files/onest-cyrillic-ext-500-normal.woff2","fonts/onest/files/onest-latin-500-normal.woff2","fonts/onest/files/onest-latin-ext-500-normal.woff2","fonts/onest/files/onest-math-500-normal.woff2","fonts/onest/files/onest-symbols-500-normal.woff2","fonts/onest/600.css","fonts/onest/files/onest-cyrillic-600-normal.woff2","fonts/onest/files/onest-cyrillic-ext-600-normal.woff2","fonts/onest/files/onest-latin-600-normal.woff2","fonts/onest/files/onest-latin-ext-600-normal.woff2","fonts/onest/files/onest-math-600-normal.woff2","fonts/onest/files/onest-symbols-600-normal.woff2","fonts/literata/500.css","fonts/literata/files/literata-cyrillic-500-normal.woff2","fonts/literata/files/literata-cyrillic-ext-500-normal.woff2","fonts/literata/files/literata-latin-500-normal.woff2","fonts/literata/files/literata-latin-ext-500-normal.woff2","fonts/literata/600.css","fonts/literata/files/literata-cyrillic-600-normal.woff2","fonts/literata/files/literata-cyrillic-ext-600-normal.woff2","fonts/literata/files/literata-latin-600-normal.woff2","fonts/literata/files/literata-latin-ext-600-normal.woff2"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Сначала сеть (чтобы приходили обновления), без сети — из кэша.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }
      // Сервер ответил ошибкой (например, 404) — отдаём сохранённую копию, если она есть.
      return caches.match(e.request, { ignoreSearch: true }).then((c) => c || (e.request.mode === "navigate" ? caches.match("index.html") : null)).then((c) => c || r);
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
