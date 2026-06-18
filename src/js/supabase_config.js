// ============================================================
// js/supabase_config.js
// Supabase 共通設定 (npm package version)
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

// ── テーブル名定数 ───────────────────────────────────────────
export const tables = {
  WH_QUIZ: "world_history_quiz",
  WH_DATES: "wh_dates",
  WH_REGIONS: "wh_regions",
  CHINESE: "chinese_history",
  SEIKEI: "seikei_events",
  ACCESS_LOG: "access_logs",
  ENGLISH_IDIOMS: "english_idioms",
  DOCS_PUBLIC: "posts_public",
  DOCS_PRIVATE: "posts_private",
  DOCS_PASSWORD: "posts_password",
};

// ── クライアント生成 ─────────────────────────────────────────
export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 非 module の設定スクリプトやグローバル参照用
window.SUPABASE_TABLES = tables;
window._db = db;
window.supabase = { createClient }; // legacy compatibility if needed
