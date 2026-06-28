// 10-clean-copy.js — dist クリーン & src コピー
//
// src/learning-box は scripts/learning-box/build.mjs が生成するため、
// コピー対象外にして無駄なディスク I/O を排除する。

import { cleanAndCopy } from "../lib/build-common.js";

export async function run() {
  console.log("[1/5] Cleaning dist/ and copying src/...");
  await cleanAndCopy("src", "dist", { exclude: ["learning-box"] });
}
