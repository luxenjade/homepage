// build.js
// ビルドパイプライン:
//   1. dist/ クリーン & src/ コピー
//   2. inner_links からカテゴリ index.html と共有データ JS 生成
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

// ── 2. inner_links からカテゴリ index.html と共有データ JS 生成 ───

console.log("[2/6] Generating category index pages...");

const SITE_URL = "https://shoei451.netlify.app";
const DEFAULT_IMAGE = `${SITE_URL}/images/favicon.png`;
const innerLinksDir = "inner_links";
const INDEX_CATEGORY_SLUGS = [
  "history",
  "seikei",
  "geography",
  "miscellaneous",
];

const categoryFiles = fs
  .readdirSync(innerLinksDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => ({
    slug: path.basename(entry.name, ".json"),
    path: path.join(innerLinksDir, entry.name),
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const subIndexTemplate = fs.readFileSync("sub-index.html", "utf8");
const innerLinksData = {};

for (const { slug, path: configPath } of categoryFiles) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  innerLinksData[slug] = config;
  const outDir = path.join("dist", slug);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "index.html"),
    renderSubIndex(subIndexTemplate, config, slug),
    "utf8",
  );
}

console.log(`  -> ${categoryFiles.length} category index pages generated`);

fs.writeFileSync(
  "dist/js/inner-links-data.js",
  `window.INNER_LINKS_DATA = ${JSON.stringify(innerLinksData, null, 2)};\n`,
  "utf8",
);
fs.writeFileSync(
  "dist/js/lists-loader.js",
  renderListsLoader(innerLinksData),
  "utf8",
);
renderIndexPage(innerLinksData);

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
    )
    .replace(
      /<main\s+id="page-content"[\s\S]*?<\/main>/,
      renderSubIndexMain(config, slug),
    );
}

function renderSubIndexMain(config, slug) {
  const backLink = config.backLink || "/index.html";
  const sections = (config.sections || [])
    .map((section) => {
      const cards = (section.items || [])
        .map((item) => renderSiteCard(item, slug))
        .join("");

      return `
        <div class="section-header">
          <h2 class="section-header__title">${escapeHtml(section.title || "")}</h2>
          ${section.desc ? `<span class="section-header__desc">${escapeHtml(section.desc)}</span>` : ""}
        </div>
        <div class="card-grid mb-4">
          ${cards}
        </div>
      `;
    })
    .join("");

  return `<main id="page-content" class="container py-4">
      <div class="page-header">
        <a href="${escapeHtml(backLink)}" class="back-link mb-2">
          <i class="bi bi-chevron-left"></i>
          ${escapeHtml(config.backLabel || "ホーム")}
        </a>
        <h1 class="page-header__title">${renderHeadingWithIcon(config)}</h1>
        ${config.headerDesc ? `<p class="page-header__desc">${escapeHtml(config.headerDesc)}</p>` : ""}
      </div>
      ${sections}
    </main>`;
}

function renderSiteCard(item, slug) {
  const link = normalizeLink(item.link || "#", slug);
  const target = item.target
    ? `target="${escapeHtml(item.target)}" rel="noopener"`
    : "";
  const icon = renderSiteCardIcon(item.icon || "");
  const titleEN = item.titleEN
    ? `<div class="en-label mb-1">${escapeHtml(item.titleEN)}</div>`
    : "";

  return `
      <a href="${escapeHtml(link)}" ${target} class="site-card text-decoration-none"
         style="display:flex; flex-direction:column; height:100%;">
        <div class="site-card__body" style="flex:1;">
          ${icon}
          ${titleEN}
          <h5 class="site-card__title">${escapeHtml(item.title || "")}</h5>
          ${item.description ? `<p class="site-card__text">${escapeHtml(item.description)}</p>` : ""}
        </div>
      </a>
    `;
}

function renderSiteCardIcon(raw) {
  if (!raw) return "";
  if (/^bi-[\w-]+$/.test(raw)) {
    return `<i class="bi ${escapeHtml(raw)} site-card__bi-icon" aria-hidden="true"></i>`;
  }
  if (/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(raw) || isAbsolutePath(raw)) {
    return `<img src="${escapeHtml(normalizeIcon(raw))}" class="site-card__icon" alt="" loading="lazy">`;
  }
  return "";
}

function renderListsLoader(data) {
  const cardsData = Object.fromEntries(
    Object.entries(data).map(([slug, config]) => [
      slug,
      extractItems(config, slug),
    ]),
  );

  return `(() => {
  window.INDEX_CATEGORY_SLUGS = ${JSON.stringify(INDEX_CATEGORY_SLUGS.filter((slug) => cardsData[slug]))};
  window.CARDS_DATA = ${JSON.stringify(cardsData, null, 2)};
  document.dispatchEvent(new CustomEvent("cards-data-ready", { detail: window.CARDS_DATA }));
  if (typeof window.tryRenderAll === "function") {
    window.tryRenderAll();
  }
  window.CARDS_DATA_READY = Promise.resolve(window.CARDS_DATA);
})();\n`;
}

function renderIndexPage(data) {
  const indexPath = "dist/index.html";
  const input = fs.readFileSync(indexPath, "utf8");
  const output = input.replace(
    /<!-- build:index-categories -->/,
    renderIndexCategories(data),
  );
  fs.writeFileSync(indexPath, output, "utf8");
}

function renderIndexCategories(data) {
  return INDEX_CATEGORY_SLUGS.filter((slug) => data[slug])
    .map((slug) => {
      const config = data[slug];
      return `
        <div class="index-section-header">
          <h2 class="index-section-header__title">${renderHeadingWithIcon(config)}</h2>
          ${config.headerDesc ? `<span class="index-section-header__desc">${escapeHtml(config.headerDesc)}</span>` : ""}
        </div>
        <div class="index-card-grid" id="cards-${escapeHtml(slug)}"></div>
      `;
    })
    .join("");
}

function renderHeadingWithIcon(config) {
  const { icon, label } = splitHeadingIcon(config);
  const iconHTML = icon
    ? `<span class="page-header__title-icon" aria-hidden="true">${escapeHtml(icon)}</span>`
    : "";
  return `${iconHTML}${escapeHtml(label)}`;
}

function splitHeadingIcon(config) {
  const raw = plainText(config.h1 || "");
  const explicitIcon = config.emoji ? plainText(config.emoji) : "";
  if (explicitIcon) {
    return {
      icon: explicitIcon,
      label: raw.replace(new RegExp(`^${escapeRegExp(explicitIcon)}\\s*`, "u"), ""),
    };
  }

  const match = raw.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*/u);
  if (!match) return { icon: "", label: raw };
  return {
    icon: match[1],
    label: raw.slice(match[0].length),
  };
}

function extractItems(config, slug) {
  return (config.sections || []).flatMap((section) =>
    (section.items || []).map((item) => ({
      title: item.title,
      description: item.description || "",
      icon: normalizeIcon(item.icon || ""),
      link: normalizeLink(item.link || "#", slug),
      target: item.target,
    })),
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

function isAbsolutePath(value) {
  return (
    !value ||
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("#") ||
    value.startsWith("mailto:")
  );
}

function normalizeLink(link, slug) {
  if (isAbsolutePath(link)) return link;
  if (link.startsWith(`${slug}/`)) return `/${link}`;
  return `/${slug}/${link}`;
}

function normalizeIcon(icon) {
  if (!icon) return "";
  if (/^bi-[\w-]+$/.test(icon)) return icon;
  if (isAbsolutePath(icon)) return icon;
  return `/${icon.replace(/^(\.\.\/)+/, "")}`;
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
