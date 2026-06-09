// build.js
// ビルドパイプライン:
//   1. dist/ クリーン & src/ コピー
//   2. inner_links / external_links から静的ページ・データ生成
//   3. esbuild（JS/CSS minify）
//   4. HTML minify

import { execSync } from "child_process";
import fs from "fs";
import { cp, glob, rm } from "node:fs/promises";
import path from "path";
import {
  SITE_URL,
  DEFAULT_IMAGE,
  TEMPLATES_DIR,
  INNER_LINKS_DIR,
  EXTERNAL_LINKS_DIR,
  INDEX_CATEGORY_SLUGS,
  SITEMAP_CATEGORIES,
} from "./config.js";
import {
  plainText,
  escapeHtml,
  escapeRegExp,
  isAbsolutePath,
} from "./utils.js";


// ── dist クリーン & コピー ─────────────────────────────

console.log("[1/4] Cleaning dist/ and copying src/...");
await rm("dist", { recursive: true, force: true });
await cp("src", "dist", { recursive: true });

// ── learning-box ビルド & 統合 ──────────────────────────

console.log("[1.5/4] Building learning-box...");
execSync("cd learning-box && pnpm run build", { stdio: "inherit" });
await cp("learning-box/dist", "dist/learning-box", { recursive: true });

// ── inner_links / external_links から静的ページ・データ生成 ───

console.log("[2/4] Generating link-driven pages...");

const categoryFiles = fs
  .readdirSync(INNER_LINKS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => ({
    slug: path.basename(entry.name, ".json"),
    path: path.join(INNER_LINKS_DIR, entry.name),
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const subIndexTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, "sub-index.html"),
  "utf8",
);
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

renderIndexPage(innerLinksData);
renderSitemapPage(innerLinksData);
renderExternalLinks();
const quizList = renderQuizPages();
renderQuizIndex(quizList);

function renderQuizPages() {
  console.log("  -> Generating static quiz pages...");
  const quizConfigDir = "src/quiz/config";
  const quizTemplate = fs.readFileSync("template/quiz.html", "utf8");
  const configFiles = fs
    .readdirSync(quizConfigDir)
    .filter((f) => f.endsWith(".js"));

  const generatedQuizzes = [];
  let count = 0;
  for (const file of configFiles) {
    const slug = path.basename(file, ".js");
    const content = fs.readFileSync(path.join(quizConfigDir, file), "utf8");
    const config = extractQuizConfig(content);

    if (!config.title) continue;

    const outDir = path.join("dist", "quiz", slug);
    fs.mkdirSync(outDir, { recursive: true });

    const rendered = renderQuizHtml(quizTemplate, config, slug);
    fs.writeFileSync(path.join(outDir, "index.html"), rendered, "utf8");
    count++;

    generatedQuizzes.push({
      slug,
      title: config.title,
      subtitle: config.subtitle,
    });
  }
  console.log(`  -> ${count} quiz pages generated`);
  return generatedQuizzes;
}

function renderQuizIndex(quizzes) {
  const indexPath = "dist/quiz/index.html";
  if (!fs.existsSync(indexPath)) return;

  const html = fs.readFileSync(indexPath, "utf8");
  const listHtml = `
    <div class="index-section-header">
      <h2 class="index-section-header__title">利用可能なクイズ</h2>
      <span class="index-section-header__desc">${quizzes.length}件</span>
    </div>
    <div class="index-card-grid">
      ${quizzes
        .map(
          (q) => `
        <a href="/quiz/${escapeHtml(q.slug)}/" class="index-card">
          <i class="bi bi-question-circle index-card__bi-icon" aria-hidden="true"></i>
          <span class="index-card__title">${escapeHtml(q.title)}</span>
          ${q.subtitle ? `<p class="index-card__desc">${escapeHtml(q.subtitle)}</p>` : ""}
        </a>
      `,
        )
        .join("")}
    </div>
  `;

  fs.writeFileSync(
    indexPath,
    html.replace(/<!-- build:quiz-list -->/, listHtml),
    "utf8",
  );
}

function extractQuizConfig(content) {
  const getString = (key) => {
    const regex = new RegExp(`${key}\\s*:\\s*["'\`](.*?)["'\`]`);
    return content.match(regex)?.[1] || "";
  };

  return {
    title: getString("title"),
    subtitle: getString("subtitle"),
    backLink: getString("backLink") || "/",
    backLabel: getString("backLabel") || "戻る",
    accentColor: getString("accentColor"),
  };
}

function renderQuizHtml(template, config, slug) {
  const fullTitle = `${config.title} | luxenjade`;
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(
      /<div class="qz-header__title" id="qz-header-title">.*?<\/div>/,
      `<div class="qz-header__title" id="qz-header-title">${escapeHtml(config.title)}</div>`,
    )
    .replace(
      /<div class="qz-header__subtitle" id="qz-header-subtitle">.*?<\/div>/,
      `<div class="qz-header__subtitle" id="qz-header-subtitle">${escapeHtml(config.subtitle)}</div>`,
    );

  // Handle back link
  html = html.replace(
    /<a class="qz-btn qz-btn--ghost qz-btn--sm" id="qz-back-link" href="\/">[\s\S]*?<\/a>/,
    `<a class="qz-btn qz-btn--ghost qz-btn--sm" id="qz-back-link" href="${escapeHtml(config.backLink)}">${escapeHtml(config.backLabel)}</a>`,
  );

  // Accent color
  if (config.accentColor) {
    html = html.replace(
      "</head>",
      `<style>:root { --qz-accent: ${config.accentColor}; }</style></head>`,
    );
  }

  // Inject canonical URL
  const canonicalUrl = `${SITE_URL}/quiz/${slug}/`;
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n</head>`,
  );

  return html;
}

function renderSubIndex(template, config, slug) {
  const url = `${SITE_URL}/${slug}/`;
  const title = config.title || `${plainText(config.h1 || slug)} | luxenjade`;
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
        <a href="./index.html" class="back-link mb-2">
          <i class="bi bi-chevron-left"></i>
          Back to Home
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

function renderIndexPage(data) {
  const indexPath = "dist/index.html";
  const input = fs.readFileSync(indexPath, "utf8");
  const output = input.replace(
    /<!-- build:index-categories -->/,
    renderIndexCategories(data),
  );
  fs.writeFileSync(indexPath, output, "utf8");
}

function renderSitemapPage(data) {
  const sitemapPath = "dist/sitemap.html";
  const input = fs.readFileSync(sitemapPath, "utf8");
  const output = input.replace(
    /<div id="sitemap-grid" class="sitemap-grid">[\s\S]*?<\/div>\s*<\/div>/,
    `<div id="sitemap-grid" class="sitemap-grid">
        ${renderSitemapCategories(data)}
      </div>`,
  );
  fs.writeFileSync(sitemapPath, output, "utf8");
}

function renderSitemapCategories(data) {
  return SITEMAP_CATEGORIES
    .map(([slug, icon, label]) => {
      const config = data[slug];
      if (!config) return "";

      const sections = config.sections || [];
      const totalItems = sections.reduce(
        (count, section) => count + (section.items || []).length,
        0,
      );
      if (!totalItems) return "";

      const sectionsHTML = sections
        .filter((section) => section.items?.length)
        .map((section) => {
          const links = section.items
            .map((item) => renderSitemapItem(item))
            .join("");
          const title =
            sections.length > 1
              ? `<div class="sitemap-section__title">${escapeHtml(section.title || "")}</div>`
              : "";

          return `
              <div class="sitemap-section">
                ${title}
                <ul class="sitemap-links">${links}</ul>
              </div>
            `;
        })
        .join("");

      return `
          <div class="sitemap-category">
            <div class="sitemap-category__header">
              <i class="bi ${escapeHtml(icon)} sitemap-category__icon"></i>
              <h2 class="sitemap-category__name">${escapeHtml(label)}</h2>
              <span class="sitemap-category__count">${totalItems}件</span>
            </div>
            ${sectionsHTML}
          </div>
        `;
    })
    .join("");
}

function renderSitemapItem(item) {
  const link = item.link || "#";
  const isExternal = link.startsWith("http") || item.target === "_blank";
  const desc = item.description || "";

  return `
                <li>
                  <a href="${escapeHtml(link)}"
                     ${isExternal ? 'target="_blank" rel="noopener"' : ""}>
                    <span class="link-title">${escapeHtml(item.title || "")}</span>
                    ${desc ? `<span class="link-desc"> ${escapeHtml(desc.slice(0, 40))}${desc.length > 40 ? "..." : ""}</span>` : ""}
                    ${isExternal ? '<i class="bi bi-box-arrow-up-right link-ext"></i>' : ""}
                  </a>
                </li>
              `;
}

function renderExternalLinks() {
  const collections = collectExternalLinkConfigs();
  const linkPageTemplate = fs.readFileSync(
    path.join(TEMPLATES_DIR, "links.html"),
    "utf8",
  );

  for (const collection of collections) {
    fs.writeFileSync(
      path.join("dist", "links", `${collection.slug}.html`),
      renderExternalLinkPage(linkPageTemplate, collection, collection.slug),
      "utf8",
    );
  }

  const indexPath = "dist/links/index.html";
  const input = fs.readFileSync(indexPath, "utf8");
  const output = input
    .replace(
      /<div class="card-grid" id="forms-grid">[\s\S]*?<\/div>/,
      `<div class="card-grid" id="forms-grid">${renderLinkCollectionCards(collections, "forms")}</div>`,
    )
    .replace(
      /<div class="section-header" id="learning-header"[\s\S]*?<\/div>\s*<div class="card-grid" id="learning-grid">[\s\S]*?<\/div>/,
      renderLearningLinkSection(collections),
    )
    .replace(
      /<script>\s*if \(document\.documentElement\.classList\.contains\("dark"\)\) \{[\s\S]*?\/\/ build:link-collections\s*<\/script>/,
      "",
    );

  fs.writeFileSync(indexPath, output, "utf8");
}

function collectExternalLinkConfigs() {
  return fs
    .readdirSync(EXTERNAL_LINKS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => {
      const slug = path.basename(entry.name, ".json");
      const config = JSON.parse(
        fs.readFileSync(path.join(EXTERNAL_LINKS_DIR, entry.name), "utf8"),
      );
      return { ...config, slug };
    })
    .sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Infinity;
      const orderB = Number.isFinite(b.order) ? b.order : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return a.slug.localeCompare(b.slug);
    });
}

function renderLearningLinkSection(collections) {
  const cards = renderLinkCollectionCards(collections, "learning");
  if (!cards) return "";

  return `<div class="section-header" id="learning-header">
        <h2 class="section-header__title">学習リンク</h2>
        <span class="section-header__desc">参考サイト・資料</span>
      </div>
      <div class="card-grid" id="learning-grid">${cards}</div>`;
}

function renderLinkCollectionCards(collections, category) {
  return collections
    .filter((collection) => collection.category === category)
    .map(renderLinkCollectionCard)
    .join("");
}

function renderLinkCollectionCard(collection) {
  const icon = collection.icon || "bi-link-45deg";
  const iconHtml = /^bi-[\w-]+$/.test(icon)
    ? `<i class="bi ${escapeHtml(icon)} site-card__bi-icon mb-3" aria-hidden="true"></i>`
    : `<img src="${escapeHtml(icon)}" class="site-card__icon mb-3" alt="" loading="lazy">`;

  return `
          <a href="${escapeHtml(collection.slug)}.html" class="site-card" style="display:flex;flex-direction:column;padding:1rem;text-decoration:none;">
            ${iconHtml}
            ${collection.titleEN ? `<div class="site-card__title-en">${escapeHtml(collection.titleEN)}</div>` : ""}
            <div style="font-size:1rem;font-weight:700;margin-bottom:0.25rem;color:var(--color-text-primary);">${escapeHtml(collection.title || "")}</div>
            ${collection.description ? `<p style="font-size:0.875rem;color:var(--color-text-secondary);margin:0;">${escapeHtml(collection.description)}</p>` : ""}
          </a>
        `;
}

function renderExternalLinkPage(template, config, slug) {
  const title = config.title || slug;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)} | luxenjade</title>`)
    .replace(
      /justify-content:\s*bace-between;/,
      "justify-content: space-between;",
    )
    .replace(
      /<main\s+class="container py-4"\s+id="main">[\s\S]*?<\/main>/,
      renderExternalLinkMain(config),
    )
    .replace(
      /<script>\s*if \(document\.documentElement\.classList\.contains\("dark"\)\) \{[\s\S]*?\/\/ build:external-link-page\s*<\/script>/,
      `<script>
      if (document.documentElement.classList.contains("dark")) {
        document.body.classList.add("dark");
      }

      const search = document.getElementById("links-search");
      const empty = document.getElementById("links-empty");
      const sections = Array.from(document.querySelectorAll("[data-links-section]"));

      search?.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        let visibleTotal = 0;

        for (const section of sections) {
          let sectionVisible = 0;
          for (const card of section.querySelectorAll("[data-link-card]")) {
            const visible = card.dataset.search.includes(query);
            card.hidden = !visible;
            if (visible) sectionVisible += 1;
          }

          section.hidden = sectionVisible === 0;
          const count = section.querySelector("[data-section-count]");
          if (count) count.textContent = \`\${sectionVisible}件\`;
          visibleTotal += sectionVisible;
        }

        if (empty) empty.style.display = visibleTotal === 0 ? "" : "none";
      });
    </script>`,
    );
}

function renderExternalLinkMain(config) {
  return `<main class="container py-4" id="main">
      <div class="page-header">
        <a href="index.html" class="back-link mb-2">
          <i class="bi bi-chevron-left"></i>
          Links
        </a>
        <h1 class="page-header__title">${escapeHtml(config.title || "")}</h1>
        ${config.description ? `<p class="page-header__desc">${escapeHtml(config.description)}</p>` : ""}
      </div>

      ${config.note ? `<div class="links-note">${escapeHtml(config.note)}</div>` : ""}

      <div class="links-search-wrap">
        <svg fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"
             viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="links-search"
          id="links-search"
          type="search"
          placeholder="キーワードで絞り込み..."
          autocomplete="off"
        />
      </div>

      <div id="sections-wrap">
        ${renderExternalLinkSections(config.sections || [])}
      </div>
      <div class="links-empty" id="links-empty" style="display:none;">
        該当するリンクがありません。
      </div>
    </main>`;
}

function renderExternalLinkSections(sections) {
  return sections
    .map((section) => {
      const items = section.items || [];
      return `
        <section data-links-section>
          <div class="index-section-header">
            <h2 class="index-section-header__title">${escapeHtml(section.title || "")}</h2>
            <span class="index-section-header__desc" data-section-count>${items.length}件</span>
          </div>
          <div class="links-card-grid mb-3">
            ${items.map(renderExternalLinkItem).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderExternalLinkItem(item) {
  const searchText = [item.title, item.titleEN, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return `
            <a href="${escapeHtml(item.url || "#")}" class="link-card"
               target="_blank" rel="noopener noreferrer"
               data-link-card data-search="${escapeHtml(searchText)}">
              <span class="link-card__title">${escapeHtml(item.title || "")}</span>
              ${item.titleEN ? `<span class="link-card__title-en">${escapeHtml(item.titleEN)}</span>` : ""}
              <svg class="link-card__icon" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          `;
}

function renderIndexCategories(data) {
  return INDEX_CATEGORY_SLUGS.filter((slug) => data[slug])
    .map((slug) => {
      const config = data[slug];
      const items = extractItems(config, slug);
      return `
        <div class="index-section-header">
          <h2 class="index-section-header__title">${renderHeadingWithIcon(config)}</h2>
          ${config.headerDesc ? `<span class="index-section-header__desc">${escapeHtml(config.headerDesc)}</span>` : ""}
        </div>
        <div class="index-card-grid" id="cards-${escapeHtml(slug)}">
          ${items.map(renderIndexCard).join("")}
        </div>
      `;
    })
    .join("");
}

function renderIndexCard(item) {
  const target = item.target
    ? `target="${escapeHtml(item.target)}" rel="noopener"`
    : "";
  const iconHtml = renderIndexCardIcon(item.icon || "");

  return `
            <a href="${escapeHtml(item.link)}" ${target} class="index-card">
              ${iconHtml}
              <span class="index-card__title">${escapeHtml(item.title || "")}</span>
              ${item.description ? `<p class="index-card__desc">${escapeHtml(item.description)}</p>` : ""}
            </a>`;
}

function renderIndexCardIcon(icon) {
  if (!icon) return "";
  if (/^bi-[\w-]+$/.test(icon)) {
    return `<i class="bi ${escapeHtml(icon)} index-card__bi-icon" aria-hidden="true"></i>`;
  }
  return `<img src="${escapeHtml(icon)}" class="index-card__icon" alt="" loading="lazy">`;
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


// ── esbuild ────────────────────────────────────────────

console.log("[3/4] Running esbuild (minify JS/CSS)...");
execSync(
  'esbuild "dist/**/*.js" "dist/**/*.css" --minify --outdir=dist --allow-overwrite',
  { stdio: "inherit" },
);



// ── HTML minify ────────────────────────────────────────
console.log("[4/4] Minifying HTML...");

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
