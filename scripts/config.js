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
// クライアント (supabase-js) から直接アクセスするため、URL と publishable key
// はビルド時に dist/js/supabase_config.js に埋め込まれる。
//
// これらは Supabase の RLS と組み合わせて使う公開情報:
//   - SUPABASE_URL: 公開プロジェクト URL
//   - SUPABASE_PUBLISHABLE_KEY: 旧 anon key (sb_publishable_*)
//
// 値の解決順:
//   1. process.env.SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY (Netlify build env,
//      CI 環境変数, `export FOO=bar` などで設定)
//   2. レガシー alias SUPABASE_PB_KEY (旧 .env との互換)
//   3. プロジェクトのデフォルト値 (本番運用前提)
//
// ⚠️ Edge Functions 側で必要な service role key は
// `netlify/lib/supabase.ts` で `Netlify.env.get("SUPABASE_SECRET_KEY")` を
// 介して取得する。このファイルから export することは一切ない。
// 漏洩防止は出力ファイルに対する混入チェック (scripts/build-steps/65-*.js) で
// 行う。 process.env の値そのものはここでは検査しない。
// (Netlify はビルド環境と Edge Functions 環境で同じ env を共有するため)

const DEFAULT_SUPABASE_URL = "https://tasapyurqvkviblnaymt.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

function readEnv(name, aliases = []) {
  for (const candidate of [name, ...aliases]) {
    const value = process.env[candidate];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

export const SUPABASE_URL =
  readEnv("SUPABASE_URL") || DEFAULT_SUPABASE_URL;

// Backward-compat: legacy alias `SUPABASE_PB_KEY` is still accepted.
export const SUPABASE_PUBLISHABLE_KEY =
  readEnv("SUPABASE_PUBLISHABLE_KEY", ["SUPABASE_PB_KEY"]) ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;
