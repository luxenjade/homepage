// 50-minify-html.js — HTML minify
import { minifyHtmlGlob } from "../lib/build-common.js";

export async function run() {
  console.log("[4/5] Minifying HTML...");
  const count = await minifyHtmlGlob("dist/**/*.html");
  console.log(`  -> ${count} HTML files minified`);
}
