// build.js — ビルドオーケストレーター
// 各ステップは scripts/build-steps/ 以下に機能分割して配置している。

import { run as stepCleanCopy } from "./build-steps/10-clean-copy.js";
import { run as stepInjectSupabase } from "./build-steps/15-inject-supabase-config.js";
import { run as stepSubProjects } from "./build-steps/20-sub-projects.js";
import { run as stepNavConfig } from "./build-steps/25-nav-config.js";
import { run as stepGeneratePages } from "./build-steps/30-generate-pages.js";
import { run as stepMinifyAssets } from "./build-steps/40-minify-assets.js";
import { run as stepCacheManifest } from "./build-steps/55-generate-cache-manifest.js";
import { run as stepMinifyHtml } from "./build-steps/50-minify-html.js";
import { run as stepSwVersion } from "./build-steps/60-sw-version.js";

await stepCleanCopy();
await stepInjectSupabase(); // ← src/.env の値を dist/js/supabase_config.js に注入
await stepSubProjects();
await stepNavConfig();
await stepGeneratePages();
await stepMinifyAssets();
await stepCacheManifest(); // ← SW にプリキャッシュ配列を注入。HTML minify より前
await stepMinifyHtml();
await stepSwVersion(); // ← 最後に SW キャッシュ名バージョンを確定

console.log("\nBuild complete.");
