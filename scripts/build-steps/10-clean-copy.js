// 10-clean-copy.js — dist クリーン & src コピー
import { cleanAndCopy } from "../lib/build-common.js";
import { rm } from "node:fs/promises";

export async function run() {
  console.log("[1/5] Cleaning dist/ and copying src/...");
  await cleanAndCopy("src", "dist");

  // src を dist に丸ごとコピーしているため、ソースファイルが dist/learning-box に混入している。
  // ビルド成果物で上書きする前に一度削除してクリーンにする。
  await rm("dist/learning-box", { recursive: true, force: true });
}
