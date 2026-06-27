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

// ── ディレクトリ同期（clean & copy）────────────────────

export async function cleanAndCopy(source, destination) {
  await fs.rm(destination, { recursive: true, force: true });
  await fs.cp(source, destination, { recursive: true });
}
