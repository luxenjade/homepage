// build.js — ビルドオーケストレーター
// 各ステップは scripts/build-steps/ 以下に機能分割して配置している。

import { run as stepCleanCopy } from "./build-steps/10-clean-copy.js";
import { run as stepSubProjects } from "./build-steps/20-sub-projects.js";
import { run as stepNavConfig } from "./build-steps/25-nav-config.js";
import { run as stepGeneratePages } from "./build-steps/30-generate-pages.js";
import { run as stepMinifyAssets } from "./build-steps/40-minify-assets.js";
import { run as stepMinifyHtml } from "./build-steps/50-minify-html.js";
import { run as stepSwVersion } from "./build-steps/60-sw-version.js";

await stepCleanCopy();
await stepSubProjects();
await stepNavConfig();
await stepGeneratePages();
await stepMinifyAssets();
await stepMinifyHtml();
await stepSwVersion();

console.log("\nBuild complete.");
