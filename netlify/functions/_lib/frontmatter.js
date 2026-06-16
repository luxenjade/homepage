"use strict";

/**
 * _lib/frontmatter.js
 * Frontmatter parser + post data builders shared by all Netlify Functions.
 */

const DEFAULT_COMPONENTS = {
  katex: false,
  highlight: false,
};

function parseScalar(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}

function toBool(val, fallback = false) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    if (val === "true") return true;
    if (val === "false") return false;
  }
  return fallback;
}

function normalizeComponents(meta) {
  const nested =
    meta && typeof meta.components === "object" ? meta.components : {};

  return {
    katex: toBool(nested.katex, toBool(meta?.["components.katex"], false)),
    highlight: toBool(
      nested.highlight,
      toBool(meta?.["components.highlight"], false),
    ),
  };
}

/**
 * Parse YAML-like frontmatter from a raw Markdown string.
 * Returns { meta, content }.
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta = {};
  let block = null;

  for (const line of match[1].split("\n")) {
    if (/^\s+\S/.test(line)) {
      if (!block) continue;
      const item = line.trim().match(/^-\s*(.*)$/);
      if (item) {
        if (!Array.isArray(meta[block])) meta[block] = [];
        meta[block].push(parseScalar(item[1].trim()));
        continue;
      }
      if (Array.isArray(meta[block])) continue;
      const c = line.indexOf(":");
      if (c === -1) continue;
      const k = line.slice(0, c).trim();
      const v = line.slice(c + 1).trim();
      if (k) meta[block][k] = parseScalar(v);
      continue;
    }
    block = null;
    const c = line.indexOf(":");
    if (c === -1) continue;
    const k = line.slice(0, c).trim();
    const v = line.slice(c + 1).trim();
    if (!k) continue;
    if (v === "") {
      meta[k] = {};
      block = k;
    } else {
      meta[k] = parseScalar(v);
    }
  }

  return { meta, content: match[2] };
}

/**
 * Normalize optional string fields.
 * Returns '' for missing keys AND for keys that exist but are empty/whitespace.
 */
function str(val) {
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return "";
}

function tags(val) {
  if (Array.isArray(val)) {
    return val.map((t) => str(t)).filter(Boolean);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    const inlineList = trimmed.match(/^\[(.*)\]$/);
    return (inlineList ? inlineList[1] : trimmed)
      .split(",")
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return [];
}

/**
 * Build metadata object for public post list (no content, no password).
 */
function buildMeta(slug, rawMd) {
  const { meta } = parseFrontmatter(rawMd);
  return {
    slug,
    title: str(meta.title) || slug,
    date: str(meta.date),
    description: str(meta.description),
    thumbnail: str(meta.thumbnail), // '' when missing or blank
    category: str(meta.category),
    components: normalizeComponents(meta),
  };
}

/**
 * Build full post data for public post viewer (includes content).
 */
function buildPostData(slug, rawMd) {
  const { meta, content } = parseFrontmatter(rawMd);
  return {
    slug,
    title: str(meta.title) || slug,
    date: str(meta.date),
    description: str(meta.description),
    thumbnail: str(meta.thumbnail),
    category: str(meta.category),
    components: Object.assign(
      {},
      DEFAULT_COMPONENTS,
      normalizeComponents(meta),
    ),
    content,
  };
}

/**
 * Build metadata for protected post list (no content, no password).
 */
function buildProtectedMeta(slug, rawMd) {
  const { meta } = parseFrontmatter(rawMd);
  return {
    slug,
    title: str(meta.title) || slug,
    date: str(meta.date),
    excerpt: str(meta.excerpt),
    thumbnail: str(meta.thumbnail),
    category: str(meta.category),
    tags: tags(meta.tags),
  };
}

/**
 * Build full post data for protected post viewer (includes content, never password).
 */
function buildProtectedPostData(slug, rawMd) {
  const { meta, content } = parseFrontmatter(rawMd);
  return {
    slug,
    title: str(meta.title) || slug,
    date: str(meta.date),
    excerpt: str(meta.excerpt),
    thumbnail: str(meta.thumbnail),
    category: str(meta.category),
    tags: tags(meta.tags),
    components: Object.assign(
      {},
      DEFAULT_COMPONENTS,
      normalizeComponents(meta),
    ),
    content,
  };
}

/**
 * Verify a plaintext password against the frontmatter `password` field.
 */
function checkPassword(rawMd, password) {
  const { meta } = parseFrontmatter(rawMd);
  return !!(meta.password && meta.password === password);
}

module.exports = {
  parseFrontmatter,
  buildMeta,
  buildPostData,
  buildProtectedMeta,
  buildProtectedPostData,
  checkPassword,
};
