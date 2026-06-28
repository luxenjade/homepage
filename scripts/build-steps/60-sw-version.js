// 60-sw-version.js — service-worker.js のキャッシュバージョンをビルド時に確定
//
// src/service-worker.js の __BUILD_VERSION__ プレースホルダを
// ビルド時刻ベースの文字列で置換し、デプロイごとに古いキャッシュが
// 確実に無効化されるようにする。

import { injectServiceWorkerVersion } from "../lib/build-common.js";

export async function run() {
  const stamp = await injectServiceWorkerVersion();
  if (stamp) {
    console.log(`[5/5] Service Worker cache stamp: ${stamp}`);
  } else {
    console.log("[5/5] Service Worker: no placeholder found, skipping.");
  }
}
