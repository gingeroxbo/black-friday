// Black Friday : utilisable hors connexion.
// La page et la liste des articles passent par le réseau d'abord (les nouveaux prix arrivent dès qu'il y a du réseau),
// tout le reste (polices, icônes) vient du cache du téléphone.
const CACHE = "bf-v1";
const SHELL = ["./", "index.html", "articles.json", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png",
  "fonts/bricolage-grotesque-latin-500-normal.woff2", "fonts/bricolage-grotesque-latin-700-normal.woff2",
  "fonts/ibm-plex-sans-latin-400-normal.woff2", "fonts/ibm-plex-sans-latin-500-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2", "fonts/ibm-plex-mono-latin-500-normal.woff2"];

self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const path = u.pathname.split("/").pop();
  const networkFirst = e.request.mode === "navigate" || path === "" || path === "index.html" || path === "articles.json";
  if (networkFirst) {
    const key = e.request.mode === "navigate" || path === "" ? "index.html" : path;
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const k = r.clone(); caches.open(CACHE).then(c => c.put(key, k)); }
      return r;
    }).catch(() => caches.match(key, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); }
      return r;
    })));
  }
});
