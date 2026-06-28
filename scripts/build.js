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
import { run as stepVerifyNoLeak } from "./build-steps/65-verify-no-secret-leak.js";

await stepCleanCopy();
await stepInjectSupabase();
await stepSubProjects();
await stepNavConfig();
await stepGeneratePages();
await stepMinifyAssets();
await stepCacheManifest();
await stepMinifyHtml();
await stepSwVersion();
await stepVerifyNoLeak(); // ← クライアント bundle に service role key が混入していないか最終チェック

console.log("\nBuild complete.");
