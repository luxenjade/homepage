// 40-minify-assets.js — esbuild による JS/CSS minify
import { minifyAssetsInDir } from "../lib/build-common.js";

export async function run() {
  console.log("[3/5] Running esbuild (bundle & minify JS/CSS)...");
  const results = await minifyAssetsInDir("dist");
  console.log(`  -> ${results.length} assets minified`);
}
