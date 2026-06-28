// ============================================================
// js/supabase_config.js
// Supabase 共通設定 (CDN version)
//
// SUPABASE_URL / SUPABASE_KEY はビルド時に scripts/build-steps/ から
// .env (scripts/config.js) から注入される。ソースに直接キーは書かない。
// ============================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.2/+esm";

const SUPABASE_URL = "__SUPABASE_URL__";
const SUPABASE_KEY = "__SUPABASE_PUBLISHABLE_KEY__";

// ── テーブル名定数 ───────────────────────────────────────────
export const tables = {
  WH_QUIZ: "world_history_quiz",
  WH_DATES: "wh_dates",
  WH_REGIONS: "wh_regions",
  CHINESE: "chinese_history",
  SEIKEI: "seikei_events",
  ACCESS_LOG: "access_logs",
  ENGLISH_IDIOMS: "english_idioms",
};

// ── クライアント生成 ─────────────────────────────────────────
export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 非 module の設定スクリプトやグローバル参照用
window.SUPABASE_TABLES = tables;
window._db = db;
window.supabase = { createClient }; // legacy compatibility if needed
