import fs from "node:fs/promises";
import path from "node:path";

const BASE_PATH = "/learning-box/";

const MANIFEST_BASE = {
  name: "luxenjade | learning box",
  short_name: "learning box",
  description: "フラッシュカードとまとめノートの学習ツール",
  start_url: `${BASE_PATH}index.html`,
  scope: BASE_PATH,
  display: "standalone",
  orientation: "any",
  background_color: "#ffffff",
  theme_color: "#faba40",
  lang: "ja",
};

function iconSizeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.includes("512")) return "512x512";
  if (lower.includes("192")) return "192x192";
  return "192x192";
}

function imageMime(name) {
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

export async function generateManifest(sourceDir, outputDir) {
  const imagesDir = path.join(sourceDir, "images");
  let names;

  try {
    names = await fs.readdir(imagesDir);
  } catch {
    names = [];
  }

  const icons = [];
  const screenshots = [];

  for (const name of names.sort()) {
    const lower = name.toLowerCase();
    const src = `images/${name}`;

    if (/screenshot/i.test(lower) && /\.(png|webp)$/i.test(name)) {
      const form_factor = /narrow|mobile|phone|portrait/i.test(lower)
        ? "narrow"
        : "wide";
      screenshots.push({
        src,
        sizes: form_factor === "narrow" ? "1080x1920" : "1920x1080",
        type: imageMime(name),
        form_factor,
        label: "learning box",
      });
      continue;
    }

    if (/\.(png|webp)$/i.test(name) && /icon/i.test(lower)) {
      const purpose = lower.includes("512") ? "maskable" : "any";
      icons.push({
        src,
        sizes: iconSizeFromName(name),
        type: imageMime(name),
        purpose,
      });
      continue;
    }

    if (name.endsWith(".svg") && /lbox|logo/i.test(lower)) {
      icons.push({
        src,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      });
    }
  }

  if (!icons.length) {
    icons.push({
      src: "images/favicon.png",
      sizes: "any",
      type: "image/png",
      purpose: "any",
    });
  }

  const manifest = {
    ...MANIFEST_BASE,
    icons,
    ...(screenshots.length ? { screenshots } : {}),
  };

  await fs.writeFile(
    path.join(outputDir, "manifest.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

export function pwaHeadTags(basePath = "") {
  const base = basePath || "";
  return `<link rel="manifest" href="${base}manifest.webmanifest" />
    <meta name="theme-color" content="#faba40" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="learning box" />
    <link rel="apple-touch-icon" href="${base}images/apple-touch-icon.png" />
    <script src="${base}js/pwa.js" defer></script>`;
}

export async function listDistFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listDistFiles(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

export async function generateServiceWorker(outputDir) {
  const files = await listDistFiles(outputDir);
  const precache = files
    .map((file) => {
      const relative = path.relative(outputDir, file).replace(/\\/g, "/");
      return BASE_PATH + relative;
    })
    .filter((url) => !url.endsWith("/service-worker.js"))
    .sort();

  const cacheId = `learning-box-${Date.now()}`;
  const source = `const CACHE=${JSON.stringify(cacheId)};
const PRECACHE=${JSON.stringify(precache)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
`;

  await fs.writeFile(path.join(outputDir, "service-worker.js"), source, "utf8");
  return precache.length;
}
