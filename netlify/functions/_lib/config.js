"use strict";

/**
 * _lib/config.js
 * Supabase configuration.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

// テーブル名 (src/js/supabase_config.js と同期させる)
const TABLES = {
  DOCS_PUBLIC: "posts_public",
  DOCS_PRIVATE: "posts_private",
  DOCS_PASSWORD: "posts_password",
};

module.exports = { SUPABASE_URL, SUPABASE_KEY, TABLES };
