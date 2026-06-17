// ============================================================
// js/supabase_config.js
// Supabase 共通設定
//
// 2026-03-20 anon key → publishable key に移行
//
// 使い方:
//   1. supabase CDN の <script> を先に読み込む
//      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//
//   2. ページ側の module script から import する
//      import { db, tables } from "../../js/supabase_config.js";
//      const { data } = await db.from(tables.WH_DATES).select('*');
//
// ============================================================

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
};

if (!window.supabase) {
  throw new Error("Supabase CDN <script> が正しく読み込まれていません。先に読み込んでください。");
}

// ── クライアント生成 ─────────────────────────────────────────
export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 非 module の設定スクリプトからも参照できるようにする
window.SUPABASE_TABLES = tables;
window._db = db;
