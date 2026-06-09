import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, extname, join, resolve, relative } from "node:path";

const ROOT = process.cwd();
const SITE_ROOTS = [resolve(ROOT, "src"), resolve(ROOT, "dist")].filter((dir) =>
  existsSync(dir),
);
const IGNORE_DIRS = new Set([".git", "node_modules", "archives"]);
const ATTR_PATTERN = /(href|src)\s*=\s*["']([^"']+)["']/gi;

const KNOWN_IGNORES = new Set([
  // 例: "history/worldhistory/quiz.html::/sub-index.html?slug=history/world",
]);

// ── ファイル収集 ──────────────────────────────────────────────

function collectFiles(dir, extensions) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files.push(...collectFiles(fullPath, extensions));
      }
      continue;
    }
    if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── リンク判定ユーティリティ ──────────────────────────────────

function isSkippableLink(link) {
  return (
    !link ||
    link.includes("${") ||
    link.startsWith("#") ||
    link.startsWith("http://") ||
    link.startsWith("https://") ||
    link.startsWith("mailto:") ||
    link.startsWith("javascript:") ||
    link.startsWith("data:")
  );
}

// ?slug= を持つリンクは動的ルーティングなので存在チェック対象外
function isDynamicSlugLink(link) {
  return link.includes("?slug=");
}

function existsAsPath(targetPath) {
  return existsSync(targetPath);
}

function resolveCandidates(baseDir, rawLink) {
  const cleanLink = rawLink.split("#")[0].split("?")[0];
  if (!cleanLink) return [];

  const basePath = cleanLink.startsWith("/")
    ? resolve(
        SITE_ROOTS.find((root) => baseDir.startsWith(root)) || baseDir,
        `.${cleanLink}`,
      )
    : resolve(baseDir, cleanLink);

  const candidates = [basePath];
  if (cleanLink.endsWith("/")) {
    candidates.push(join(basePath, "index.html"));
  } else if (!extname(basePath)) {
    candidates.push(`${basePath}.html`);
    candidates.push(join(basePath, "index.html"));
  }
  return candidates;
}

// ── HTML チェック ─────────────────────────────────────────────

function checkHtmlFiles(errors) {
  for (const siteRoot of SITE_ROOTS) {
    const htmlFiles = collectFiles(siteRoot, [".html"]);

    for (const htmlFile of htmlFiles) {
      const content = readFileSync(htmlFile, "utf8").replace(
        /<!--[\s\S]*?-->/g,
        "",
      );
      const matches = [...content.matchAll(ATTR_PATTERN)];
      const relativeFile = relative(ROOT, htmlFile).replaceAll("\\", "/");

      for (const match of matches) {
        const link = match[2].trim();

        if (isSkippableLink(link)) continue;
        if (link.includes("{{")) continue;
        if (isDynamicSlugLink(link)) continue;
        if (KNOWN_IGNORES.has(`${relativeFile}::${link}`)) continue;

        const candidates = resolveCandidates(dirname(htmlFile), link);
        if (!candidates.some(existsAsPath)) {
          errors.push({ source: relativeFile, link });
        }
      }
    }
  }
}

// ── メイン ────────────────────────────────────────────────────

const errors = [];
checkHtmlFiles(errors);

if (errors.length) {
  console.error("Broken local links found:");
  errors.forEach(({ source, link }) => console.error(`  ${source} -> ${link}`));
  process.exit(1);
}

const htmlCount = SITE_ROOTS.reduce(
  (sum, siteRoot) => sum + collectFiles(siteRoot, [".html"]).length,
  0,
);

console.log(`Local link check passed — ${htmlCount} HTML files.`);
