// scripts/config.js

export const SITE_URL = "https://luxenjade.netlify.app";
export const DEFAULT_IMAGE = `${SITE_URL}/images/favicon.png`;

export const TEMPLATES_DIR = "template";
export const INNER_LINKS_DIR = "inner_links";
export const EXTERNAL_LINKS_DIR = "external_links";

export const INDEX_CATEGORY_SLUGS = [
  "history",
  "seikei",
  "geography",
  "miscellaneous",
];

export const SITEMAP_CATEGORIES = [
  ["history", "bi-clock-history", "歴史"],
  ["geography", "bi-globe", "地理"],
  ["seikei", "bi-bank", "政治・経済"],
  ["miscellaneous", "bi-grid", "その他"],
  ["projects", "bi-box-arrow-up-right", "Projects"],
];

// ── Supabase (browser-side) ───────────────────────────────
//
// クライアントから supabase-js で直接アクセスするため、URL と publishable key
// はビルド時に埋め込まれる。値は .env から読み取る。
//
// Edge Functions 側で必要な service role key は
// `netlify/lib/supabase.ts` で `Netlify.env.get("SUPABASE_SECRET_KEY")` を
// 介して取得する (この config.js には載せない)。

const DEFAULT_SUPABASE_URL = "https://tasapyurqvkviblnaymt.supabase.co";

function readEnv(name, aliases = []) {
  for (const candidate of [name, ...aliases]) {
    const value = process.env[candidate];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

function requiredEnv(name, aliases = []) {
  const value = readEnv(name, aliases);
  if (value) return value;
  throw new Error(
    `Missing required environment variable: ${name}` +
    (aliases.length ? ` (or legacy alias: ${aliases.join(", ")})` : "") +
    `. Set it in .env (see .env.example) or as a process env var.`,
  );
}

// URL is treated as public information — fall back to the production URL
// when SUPABASE_URL is not provided so existing `.env` files keep working.
export const SUPABASE_URL =
  readEnv("SUPABASE_URL") || DEFAULT_SUPABASE_URL;

// Backward-compat: legacy alias `SUPABASE_PB_KEY` is still accepted.
export const SUPABASE_PUBLISHABLE_KEY = requiredEnv(
  "SUPABASE_PUBLISHABLE_KEY",
  ["SUPABASE_PB_KEY"],
);

