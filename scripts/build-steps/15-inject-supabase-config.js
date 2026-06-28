// 15-inject-supabase-config.js — Supabase キーをビルド時に注入
//
// src/js/supabase_config.js の __SUPABASE_URL__ / __SUPABASE_PUBLISHABLE_KEY__
// プレースホルダを scripts/config.js (.env 由来) の値で置換する。
//
// 重要: プレースホルダは dist/ 側にだけ書き戻し、src/ は変更しない。
// これで開発中に git diff が走っても誤ってキーがコミットされない。

import fs from "node:fs/promises";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../config.js";
import { pathExists } from "../lib/build-common.js";

const TARGET = "dist/js/supabase_config.js";

export async function run() {
  if (!(await pathExists(TARGET))) {
    console.log("  -> dist/js/supabase_config.js not found, skipping.");
    return;
  }

  const source = await fs.readFile(TARGET, "utf8");

  // Build-time constants are already validated by requiredEnv() in config.js.
  // Escape any backticks / template-string chars just in case the key contains them.
  const escape = (s) => s.replace(/`/g, "\\`").replace(/\$/g, "\\$");

  const output = source
    .replace(/__SUPABASE_URL__/g, escape(SUPABASE_URL))
    .replace(/__SUPABASE_PUBLISHABLE_KEY__/g, escape(SUPABASE_PUBLISHABLE_KEY));

  if (output === source) {
    console.warn(
      "  -> Supabase placeholders not found in dist/js/supabase_config.js (skipping).",
    );
    return;
  }

  await fs.writeFile(TARGET, output, "utf8");
  console.log("  -> Injected Supabase URL + publishable key from .env.");
}
