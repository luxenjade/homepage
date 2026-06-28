// 55-generate-cache-manifest.js — プリキャッシュマニフェスト自動生成 + SW 注入
//
// 1. dist/ を再帰的に走査し、HTML / CSS / JS / 画像 / フォント などの
//    キャッシュ対象パスを列挙する (cache-manifest.js を生成)
// 2. dist/service-worker.js の __SHELL_ASSETS__ プレースホルダを
//    生成した配列リテラルに置換する
//
// 実行順: 40-minify-assets (JS/CSS minify) の後、
//         50-minify-html の前。minify 後のサイズがプリキャッシュ対象になる。

import {
  writePrecacheManifest,
  injectShellAssetsList,
} from "../lib/build-common.js";

export async function run() {
  console.log("[3.5/5] Generating Service Worker precache manifest...");

  const urls = await writePrecacheManifest({
    distDir: "dist",
    outputPath: "dist/cache-manifest.js",
  });

  const replaced = await injectShellAssetsList({
    swPath: "dist/service-worker.js",
    urls,
  });

  console.log(`  -> ${urls.length} precache URLs collected`);
  if (!replaced) {
    console.warn(
      "  -> __SHELL_ASSETS__ placeholder not found in service-worker.js (skipping injection)",
    );
  }
}
