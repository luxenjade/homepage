// build-common.js — ビルドパイプライン共通ユーティリティ
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "html-minifier-terser";
import esbuild from "esbuild";

// ── ファイルシステムユーティリティ ─────────────────────

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── PWA head snippet injection ─────────────────────────

const PWA_HEAD_SNIPPET_TAGS = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="theme-color" content="#faba40" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="luxenjade" />',
  '<link rel="icon" type="image/png" href="/images/favicon.png" />',
  '<link rel="apple-touch-icon" href="/images/favicon.png" />',
];

export function injectPwaHeadSnippet(html) {
  if (!html.includes("<head")) return html;

  let output = html;
  for (const tag of PWA_HEAD_SNIPPET_TAGS) {
    if (output.includes(tag)) continue;
    output = output.replace(/<\/head>/i, `    ${tag}\n</head>`);
  }

  return output;
}

export async function injectPwaHeadSnippetIntoFiles(filePaths) {
  for (const file of filePaths) {
    const input = await fs.readFile(file, "utf8");
    const output = injectPwaHeadSnippet(input);
    if (output !== input) {
      await fs.writeFile(file, output, "utf8");
    }
  }

  return filePaths.length;
}

export async function injectPwaHeadSnippetIntoDir(dir) {
  const htmlFiles = (await listFiles(dir)).filter((file) => file.endsWith(".html"));
  return injectPwaHeadSnippetIntoFiles(htmlFiles);
}

// ── Access-log snippet injection ───────────────────────

const SNIPPET_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "snippet.js");

export function injectAccessLogSnippet(html, snippetSource = "") {
  if (!html.includes("<body")) return html;
  if (html.includes("window.hasSentAccessLog")) return html;

  const snippet = snippetSource || "";
  if (!snippet) {
    return html;
  }

  return html.replace(/<\/body>/i, `\n<script>\n${snippet}\n</script>\n</body>`);
}

export async function injectAccessLogSnippetIntoFiles(filePaths, snippetSource = "") {
  const source = snippetSource || (await fs.readFile(SNIPPET_PATH, "utf8"));

  for (const file of filePaths) {
    const input = await fs.readFile(file, "utf8");
    const output = injectAccessLogSnippet(input, source);
    if (output !== input) {
      await fs.writeFile(file, output, "utf8");
    }
  }

  return filePaths.length;
}

export async function injectAccessLogSnippetIntoDir(dir) {
  const htmlFiles = (await listFiles(dir)).filter((file) => file.endsWith(".html"));
  return injectAccessLogSnippetIntoFiles(htmlFiles);
}

export async function injectBuildSnippetsIntoDir(dir) {
  await injectPwaHeadSnippetIntoDir(dir);
  await injectAccessLogSnippetIntoDir(dir);
  return true;
}

// ── HTML minify ─────────────────────────────────────────

const DEFAULT_HTML_MINIFY_OPTIONS = {
  collapseWhitespace: true,
  conservativeCollapse: false, // 連続空白を1つに
  removeComments: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: false, // alt="" を守る
  minifyCSS: true,
  minifyJS: true,
};

/**
 * @param {string[]} filePaths  HTML ファイルパスの配列
 * @param {object} [options]    html-minifier-terser オプション（省略時はデフォルト）
 */
export async function minifyHtmlFiles(filePaths, options) {
  const opts = {
    ...DEFAULT_HTML_MINIFY_OPTIONS,
    ...options,
  };

  for (const file of filePaths) {
    const input = await fs.readFile(file, "utf-8");
    const isFlashcardHtml = file.includes("learning-box/flashcards/");
    const output = await minify(input, {
      ...opts,
      minifyJS: isFlashcardHtml ? false : opts.minifyJS,
    });
    await fs.writeFile(file, output);
  }

  return filePaths.length;
}

// glob パターンから HTML ファイルを収集して一括 minify
// @param {string} globPattern  例: "dist/**/.html"
// @param {object} [options]

export async function minifyHtmlGlob(globPattern, options) {
  const { glob } = await import("node:fs/promises");
  const files = [];
  for await (const file of glob(globPattern)) {
    files.push(file);
  }
  const count = await minifyHtmlFiles(files, options);
  return count;
}

// ── JS/CSS minify (esbuild) ─────────────────────────────

export async function minifyAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const loader = ext === ".css" ? "css" : "js";
  const source = await fs.readFile(filePath, "utf8");

  const result = await esbuild.transform(source, {
    charset: "utf8",
    legalComments: "none",
    loader,
    minify: true,
    target: loader === "js" ? "es2018" : undefined,
  });

  await fs.writeFile(filePath, result.code, "utf8");

  return {
    filePath,
    beforeBytes: Buffer.byteLength(source),
    afterBytes: Buffer.byteLength(result.code),
  };
}

export async function minifyAssets(filePaths) {
  return Promise.all(filePaths.map(minifyAsset));
}

export async function minifyAssetsInDir(dir) {
  const files = await listFiles(dir);
  const assetFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".js" || ext === ".css";
  });
  return minifyAssets(assetFiles);
}

// ── Service Worker バージョン置換 ──────────────────────

/**
 * Replace the `__BUILD_VERSION__` placeholder in `service-worker.js` with a
 * build-time stamp so cache names invalidate automatically on each build.
 *
 * Default stamp format: `v<unix-ms-base36>`. Pass `version` to override.
 */
export async function injectServiceWorkerVersion({
  filePath = "dist/service-worker.js",
  version,
} = {}) {
  if (!(await pathExists(filePath))) return null;

  const stamp =
    version ||
    `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const source = await fs.readFile(filePath, "utf8");
  if (!source.includes("__BUILD_VERSION__")) return null;

  const output = source.replace(/__BUILD_VERSION__/g, stamp);
  await fs.writeFile(filePath, output, "utf8");
  return stamp;
}

// ── Service Worker プリキャッシュマニフェスト ────────────

/** Asset extensions that should be precached (HTML/CSS/JS/images/fonts/manifest/icons). */
const PRECACHE_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".webmanifest",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp4",
  ".webm",
  ".mp3",
  ".wav",
  ".ogg",
  ".wasm",
]);

/** Skip these subtrees under dist/ when scanning for precache targets. */
const PRECACHE_SKIP_DIRS = new Set([
  "api", // Edge Function routes are dynamic, never precache them
  "node_modules",
]);

/** Maximum file size to precache (bytes). Larger files go runtime-cache only. */
const PRECACHE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/** Always include these root-level paths regardless of what the scanner finds. */
const PRECACHE_REQUIRED_ROOTS = ["/", "/index.html", "/manifest.json"];

/**
 * Walk `distDir` and produce a deduplicated, sorted list of URL paths that
 * the Service Worker should precache. Files larger than PRECACHE_MAX_BYTES
 * or matching PRECACHE_SKIP_DIRS are excluded — they fall back to runtime
 * caching instead.
 */
export async function collectPrecacheEntries(distDir = "dist") {
  if (!(await pathExists(distDir))) return [];

  const entries = new Set();

  // Required roots
  for (const root of PRECACHE_REQUIRED_ROOTS) entries.add(root);

  const stack = [distDir];
  while (stack.length) {
    const current = stack.pop();
    const dirEntries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of dirEntries) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (PRECACHE_SKIP_DIRS.has(entry.name)) continue;
        stack.push(full);
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!PRECACHE_EXTENSIONS.has(ext)) continue;

      const stat = await fs.stat(full);
      if (stat.size > PRECACHE_MAX_BYTES) continue;

      const urlPath = toUrlPath(distDir, full);
      entries.add(urlPath);
    }
  }

  return [...entries].sort();
}

/** Convert an absolute file path under `distDir` to a public URL path. */
function toUrlPath(distDir, absPath) {
  const rel = path.relative(distDir, absPath).split(path.sep).join("/");
  if (rel.startsWith("index.html")) return rel === "index.html" ? "/" : `/${rel}`;
  return `/${rel}`;
}

/**
 * Generate the precache manifest module consumed by the Service Worker and
 * write it next to the SW source. The output is an ES module that exports
 * a single `PRECACHE_URLS` array.
 *
 * Returns the generated array (useful for tests).
 */
export async function writePrecacheManifest({
  distDir = "dist",
  outputPath = "dist/cache-manifest.js",
} = {}) {
  const urls = await collectPrecacheEntries(distDir);
  const lines = [
    "// AUTO-GENERATED by scripts/build-steps/55-generate-cache-manifest.js",
    "// Do not edit by hand. Regenerate with the build pipeline.",
    "",
    "export const PRECACHE_URLS = " + JSON.stringify(urls, null, 2) + ";",
    "",
  ];
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, lines.join("\n"), "utf8");
  return urls;
}

/**
 * Replace the `__SHELL_ASSETS__` placeholder in `service-worker.js` with the
 * contents of the precache manifest (an array literal).
 *
 * The SW source is expected to declare `let SHELL_ASSETS = __SHELL_ASSETS__;`
 * or `const SHELL_ASSETS = __SHELL_ASSETS__;`.
 */
export async function injectShellAssetsList({
  swPath = "dist/service-worker.js",
  urls,
} = {}) {
  if (!(await pathExists(swPath))) return false;
  if (!Array.isArray(urls)) return false;

  const source = await fs.readFile(swPath, "utf8");
  if (!source.includes("__SHELL_ASSETS__")) return false;

  const literal = JSON.stringify(urls, null, 2);
  const output = source.replace(/__SHELL_ASSETS__/g, literal);
  await fs.writeFile(swPath, output, "utf8");
  return true;
}

// ── ディレクトリ同期（clean & copy）────────────────────

/**
 * Copy `source` to `destination`. Optionally skip entries listed in
 * `options.exclude` (matched against entry names, anywhere in the tree).
 *
 * Implementation: enumerate the source tree and `fs.cp` each kept entry.
 * Skipped subtrees are never traversed or copied, which avoids the
 * "copy then delete" anti-pattern used by older builds.
 */
export async function cleanAndCopy(source, destination, options = {}) {
  const exclude = new Set(options.exclude || []);

  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });

  const entries = await fs.readdir(source, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => !exclude.has(entry.name))
      .map((entry) =>
        fs.cp(path.join(source, entry.name), path.join(destination, entry.name), {
          recursive: true,
        }),
      ),
  );
}
