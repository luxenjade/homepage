// ============================================================
// service-worker.js
// App Shell キャッシュ戦略
//
// - SHELL_ASSETS: 静的アセット → Cache First（即時表示）
// - Supabase / Raindrop API → Network Only（キャッシュしない）
// - その他すべて → Network First（通常はネット、失敗時はキャッシュ）
// ============================================================

const CACHE_VERSION = "v2";
const SHELL_CACHE = `shoei451-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `shoei451-runtime-${CACHE_VERSION}`;

// ── App Shell: Cache First で返す静的アセット ──────────────────
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/sub-index.html",
  "/quiz/index.html",
  "/css/base.css",
  "/css/theme-toggle.css",
  "/js/icons.js",
  "/js/nav.js",
  "/js/theme-toggle.js",
  "/js/wh-utils.js",
  "/js/sub-index-init.js",
  "/images/favicon.ico",
  "/images/favicon.png",
  "/manifest.json",
];

// ── キャッシュしないドメイン ───────────────────────────────────
const BYPASS_ORIGINS = [
  "supabase.co", // Supabase API（常に最新データが必要）
  "raindrop.io", // Raindrop API
  "netlify.app", // Netlify Functions（/api/sw アクセスログ等）
];

// ── Install: App Shell を事前キャッシュ ───────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: 古いキャッシュを削除 ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: リクエスト種別ごとに戦略を切り替え ─────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST / 非GET → そのままネットワークへ（アクセスログ等）
  if (request.method !== "GET") return;

  // Supabase / Raindrop → Network Only（キャッシュしない）
  if (BYPASS_ORIGINS.some((origin) => url.hostname.includes(origin))) return;

  // chrome-extension など → スキップ
  if (!url.protocol.startsWith("http")) return;

  // App Shell アセット → Cache First
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // その他（quiz config JS / quiz CSS / images 等）→ Network First
  event.respondWith(networkFirst(request));
});

// ── Cache First ────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  // キャッシュにない場合はネットワークから取得してキャッシュに追加
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback();
  }
}

// ── Network First ──────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? offlineFallback();
  }
}

// ── オフライン時のフォールバック ──────────────────────────────
function offlineFallback() {
  return new Response(
    `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline — Shoei451</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: #fafaf8; color: #1a1d23;
    }
    .box { text-align: center; padding: 2rem; max-width: 360px; }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.3rem; margin-bottom: .5rem; }
    p { color: #6c757d; font-size: .95rem; line-height: 1.7; }
    a {
      display: inline-block; margin-top: 1.5rem;
      padding: .6rem 1.5rem;
      background: #faba40; color: #1a1d23;
      border-radius: 6px; text-decoration: none; font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">📡</div>
    <h1>You are offline</h1>
    <p>To view this page, you need an internet connection. Please check your connection and try again.</p>
    <a onclick="location.reload()">Reload</a>
  </div>
</body>
</html>`,
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
