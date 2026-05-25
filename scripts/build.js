// build.js
// ビルドパイプライン:
//   1. dist/ クリーン & src/ コピー
//   2. inner_links からカテゴリ index.html/list.json 生成
//   3. quiz-bundle.css 生成（コンポーネントCSS結合）
//   4. esbuild（JS/CSS minify）
//   5. purgecss

import { execSync } from "child_process";
import fs from "fs";
import { cp, glob, rm } from "node:fs/promises";
import path from "path";

// ── 1. dist クリーン & コピー ─────────────────────────────

console.log("[1/6] Cleaning dist/ and copying src/...");
await rm("dist", { recursive: true, force: true });
await cp("src", "dist", { recursive: true });

// ── 2. inner_links からカテゴリ index.html/list.json 生成 ───

console.log("[2/6] Generating category index pages...");

const SITE_URL = "https://shoei451.netlify.app";
const DEFAULT_IMAGE = `${SITE_URL}/images/favicon.png`;
const innerLinksDir = "inner_links";

const categoryFiles = fs
  .readdirSync(innerLinksDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => ({
    slug: path.basename(entry.name, ".json"),
    path: path.join(innerLinksDir, entry.name),
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const subIndexTemplate = fs.readFileSync("sub-index.html", "utf8");

for (const { slug, path: configPath } of categoryFiles) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const outDir = path.join("dist", slug);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "list.json"),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(outDir, "index.html"),
    renderSubIndex(subIndexTemplate, config, slug),
    "utf8",
  );
}

console.log(`  -> ${categoryFiles.length} category index pages generated`);

function renderSubIndex(template, config, slug) {
  const url = `${SITE_URL}/${slug}/`;
  const title = config.title || `${plainText(config.h1 || slug)} — Shoei451`;
  const description =
    config.description ||
    config.headerDesc ||
    `${plainText(config.h1 || slug)} の学習ツール一覧です。`;
  const image = config.ogImage || config.image || DEFAULT_IMAGE;
  const structuredData = config.structuredData || buildStructuredData(config, {
    slug,
    title,
    description,
    url,
    image,
  });

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:image" content="${escapeHtml(image)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    )
    .replace(
      /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`,
    );
}

function buildStructuredData(config, { title, description, url, image }) {
  const items = (config.sections || [])
    .flatMap((section) => section.items || [])
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: plainText(item.title || item.titleEN || ""),
      url: toAbsoluteUrl(item.link || url),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: plainText(title),
    description: plainText(description),
    url,
    image,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items,
    },
  };
}

function toAbsoluteUrl(value) {
  if (!value) return SITE_URL;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
}

function plainText(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── 3. quiz-bundle.css 生成 ───────────────────────────────

console.log("[3/6] Bundling quiz component CSS...");

const QUIZ_CSS_FILES = [
  "dist/quiz/components/quiz-shell.css",
  "dist/quiz/components/start/start-screen.css",
  "dist/quiz/components/progress/progress.css",
  "dist/quiz/components/question/question-area.css",
  "dist/quiz/components/answer/answer.css",
  "dist/quiz/components/answer/table-input.css",
  "dist/quiz/components/feedback/feedback.css",
  "dist/quiz/components/result/result.css",
  "dist/quiz/components/modal/modal.css",
];

const bundled = QUIZ_CSS_FILES.map((f) => {
  if (!fs.existsSync(f)) {
    console.warn(`  WARNING: ${f} not found, skipping`);
    return "";
  }
  return fs.readFileSync(f, "utf8");
}).join("\n");

const bundleOut = "dist/quiz/components/quiz-bundle.css";
fs.writeFileSync(bundleOut, bundled, "utf8");
console.log(`  → ${bundleOut} (${(bundled.length / 1024).toFixed(1)} KB)`);

// ── 4. esbuild ────────────────────────────────────────────

console.log("[4/6] Running esbuild (minify JS/CSS)...");
execSync(
  'esbuild "dist/**/*.js" "dist/**/*.css" --minify --outdir=dist --allow-overwrite',
  { stdio: "inherit" },
);

// ── 5. purgecss ───────────────────────────────────────────

console.log("[5/6] Running purgecss...");
execSync(
  [
    "purgecss",
    "--css dist/css/base.css dist/css/utils.css dist/quiz/components/quiz-shell.css",
    "--content 'dist/**/*.html' 'dist/**/*.js'",
    "--output dist/css/",
    "--safelist /^qz-/ /^tl-/ /^bi/ show is-correct is-incorrect is-locked hidden is-active is-selected is-fallback is-open is-expanded is-visible dark fade",
  ].join(" "),
  { stdio: "inherit" },
);

// html minify

// ── 6. HTML minify ────────────────────────────────────────
console.log("[6/6] Minifying HTML...");

import { minify } from "html-minifier-terser";

const htmlFiles = [];
for await (const file of glob("dist/**/*.html")) {
  htmlFiles.push(file);
}

for (const file of htmlFiles) {
  const input = fs.readFileSync(file, "utf-8");
  const output = await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: false, // 追加: 連続空白を1つに
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: false, // alt="" を守る
    minifyCSS: true,
    minifyJS: true,
  });
  fs.writeFileSync(file, output);
}
console.log(`  → ${htmlFiles.length} HTML files minified`);
console.log("\nBuild complete.");
