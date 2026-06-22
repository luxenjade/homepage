// 20-sub-projects.js — learning-box ビルド呼び出し
import { rm } from "node:fs/promises";
import { build as buildLearningBox } from "../learning-box/build.mjs";

export async function run() {
  console.log("[1.5/5] Building learning-box...");

  await rm("dist/learning-box", { recursive: true, force: true });
  await buildLearningBox();
}
