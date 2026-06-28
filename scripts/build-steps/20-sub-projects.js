// 20-sub-projects.js — learning-box ビルド呼び出し
//
// src → dist のコピー (10-clean-copy.js) で learning-box は除外済み。
// ここでは dist/learning-box を新規生成するだけで、事前削除は不要。

import { build as buildLearningBox } from "../learning-box/build.mjs";

export async function run() {
  console.log("[1.5/5] Building learning-box...");
  await buildLearningBox();
}
