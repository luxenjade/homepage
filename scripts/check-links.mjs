import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, extname, join, resolve, relative } from "node:path";

const ROOT = process.cwd();
const SITE_ROOT = resolve(ROOT, "src");
const INNER_LINKS_ROOT = resolve(ROOT, "inner_links");
const EXTERNAL_LINKS_ROOT = resolve(ROOT, "external_links");
const IGNORE_DIRS = new Set([".git", "node_modules", "archives"]);
const ATTR_PATTERN = /(href|src)\s*=\s*["']([^"']+)["']/gi;

// HTMLファイル内の特定リンクを除外するエントリ。
// フォーマット: "relativeHtmlPath::rawLink"
// 動的リンクなど、check-links で false positive になるものを登録する。
const KNOWN_IGNORES = new Set([
  // 例: "history/worldhistory/quiz.html::/dynamic/path",
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
  return (
    existsSync(targetPath) ||
    existsAsGeneratedInnerLinkPath(targetPath) ||
    existsAsGeneratedExternalLinkPath(targetPath)
  );
}

function existsAsGeneratedInnerLinkPath(targetPath) {
  const relativeTarget = relative(SITE_ROOT, targetPath).replaceAll("\\", "/");
  if (relativeTarget === "quiz/components/quiz-bundle.css") {
    return true;
  }

  const match = relativeTarget.match(/^([^/]+)\/index\.html$/);
  if (!match) return false;
  return existsSync(join(INNER_LINKS_ROOT, `${match[1]}.json`));
}

function existsAsGeneratedExternalLinkPath(targetPath) {
  const relativeTarget = relative(SITE_ROOT, targetPath).replaceAll("\\", "/");
  const match = relativeTarget.match(/^links\/([^/]+)\.html$/);
  if (!match) return false;
  return existsSync(join(EXTERNAL_LINKS_ROOT, `${match[1]}.json`));
}

function resolveCandidates(baseDir, rawLink) {
  const cleanLink = rawLink.split("#")[0].split("?")[0];
  if (!cleanLink) return [];

  const basePath = cleanLink.startsWith("/")
    ? resolve(SITE_ROOT, `.${cleanLink}`)
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
  const htmlFiles = collectFiles(SITE_ROOT, [".html"]);

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
      if (isDynamicSlugLink(link)) continue;
      if (KNOWN_IGNORES.has(`${relativeFile}::${link}`)) continue;

      const candidates = resolveCandidates(dirname(htmlFile), link);
      if (!candidates.some(existsAsPath)) {
        errors.push({ source: relativeFile, link });
      }
    }
  }
}

// ── inner_links チェック ──────────────────────────────────────

function collectInnerLinkFiles() {
  if (!existsSync(INNER_LINKS_ROOT)) return [];
  return readdirSync(INNER_LINKS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(INNER_LINKS_ROOT, entry.name));
}

function checkInnerLinkJsonFiles(errors) {
  const jsonFiles = collectInnerLinkFiles();
  for (const jsonFile of jsonFiles) {
    const relativeFile = relative(ROOT, jsonFile).replaceAll("\\", "/");
    const slug = basename(jsonFile, ".json");
    const generatedBaseDir = join(SITE_ROOT, slug);
    let cfg;

    try {
      cfg = JSON.parse(readFileSync(jsonFile, "utf8"));
    } catch {
      errors.push({ source: relativeFile, link: "(JSON parse error)" });
      continue;
    }

    const sections = cfg.sections ?? [];
    for (const section of sections) {
      const items = section.items ?? [];
      for (const item of items) {
        const link = item.link;
        if (!link) continue;
        if (isSkippableLink(link)) continue;
        if (isDynamicSlugLink(link)) continue;

        const candidates = resolveCandidates(generatedBaseDir, link);
        if (!candidates.some(existsAsPath)) {
          errors.push({ source: relativeFile, link });
        }
      }
    }

    // backLink も確認
    if (
      cfg.backLink &&
      !isSkippableLink(cfg.backLink) &&
      !isDynamicSlugLink(cfg.backLink)
    ) {
      const candidates = resolveCandidates(generatedBaseDir, cfg.backLink);
      if (!candidates.some(existsAsPath)) {
        errors.push({ source: relativeFile, link: cfg.backLink });
      }
    }
  }
}

// ── メイン ────────────────────────────────────────────────────

const errors = [];
checkHtmlFiles(errors);
checkInnerLinkJsonFiles(errors);

if (errors.length) {
  console.error("Broken local links found:");
  errors.forEach(({ source, link }) => console.error(`  ${source} -> ${link}`));
  process.exit(1);
}

const htmlCount = collectFiles(SITE_ROOT, [".html"]).length;
const jsonCount = collectInnerLinkFiles().length;

console.log(
  `Local link check passed | ${htmlCount} HTML files, ${jsonCount} inner_links files.`,
);
