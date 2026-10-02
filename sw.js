/* ==========================================================
   sw.js  (Service Worker)
   Menyimpan file aplikasi di HP supaya bisa dibuka tanpa internet.
   Data keuangan TIDAK lewat sini; itu diurus js/sync.js.
   ========================================================== */

const CACHE = "keuangan-v1";

// File milik aplikasi sendiri
const LOCAL_FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/variables.css",
  "css/base.css",
  "css/components.css",
  "js/config.js",
  "js/utils.js",
  "js/supabase.js",
  "js/auth.js",
  "js/storage.js",
  "js/store.js",
  "js/sync.js",
  "js/render.js",
  "js/sheet.js",
  "js/pwa.js",
  "js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// File dari internet yang dipakai halaman
const EXTERNAL_FILES = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap",
];

// ---------- Pemasangan: simpan semua file ----------

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(LOCAL_FILES);
      // Kalau salah satu gagal diunduh, jangan batalkan pemasangan
      await Promise.allSettled(EXTERNAL_FILES.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

// ---------- Aktivasi: buang cache versi lama ----------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

// ---------- Strategi pengambilan file ----------

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

/** File aplikasi: coba internet dulu (supaya selalu terbaru), kalau gagal pakai simpanan */
const networkFirst = async (request) => {
  const cache = await caches.open(CACHE);
  try {
    const response = await withTimeout(fetch(request), 4000);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match("index.html");
    return Response.error();
  }
};

/** File dari luar (library, font): pakai simpanan, perbarui diam-diam di belakang */
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || update;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;
  if (url.hostname.endsWith(".supabase.co")) return; // data & login: selalu langsung ke Supabase

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});