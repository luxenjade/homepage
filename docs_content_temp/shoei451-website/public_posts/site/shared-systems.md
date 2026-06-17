---
title: shoei451-website 共通基盤メモ
date: 2026-04-03
description: 共通ランタイム、データ取得、Netlify 周辺の整理
thumbnail:
category: developer
components.katex: false
components.highlight: true
published: true
---

# shoei451-website 共通基盤メモ

最終更新: 2026-04-03

---

## 1. サイト共通 UI

### ナビ / フッター

- 実体: `src/js/nav.js`
- 役割: ナビバー、フッター、active link 判定を inject
- 現在の主要導線: `history`, `geography`, `seikei`, `miscellaneous`, `about`

### テーマ切替

- 実体: `src/js/theme-toggle.js`
- 共通 CSS: `src/css/base.css`
- 補足: `theme-toggle.css` は `base.css` に統合済みで、古い参照だけが一部に残っている

---

## 2. カテゴリ一覧基盤

- 実体: `src/sub-index.html` + `src/js/sub-index-init.js`
- データソース: 各カテゴリの `src/*/list.json`
- 対象: `history`, `geography`, `seikei`, `miscellaneous`, `projects`

ここが「サイトのディレクトリ構造」と「閲覧導線」をつなぐ中心になっている。

---

## 3. クイズ基盤

- 実体: `src/quiz/index.html`, `src/quiz/logic.js`, `src/quiz/components/`
- 設定: `src/quiz/config/*.js`
- 現在の代表 slug:
  - `wh-year-to-event`
  - `wh-event-to-year`
  - `china-era`
  - `seikei`
  - `idiom`
  - `hex`
  - `capitals`

旧 `quiz-components/` という別ディレクトリはすでに正本ではなく、現行実装は `src/quiz/components/` を参照する。

---

## 4. 年表基盤

- 実体: `src/timeline/index.html`, `src/timeline/script.js`, `src/timeline/style.css`
- 設定: `src/timeline/config/*.js`
- 現在の代表 slug:
  - `world-history`
  - `china-history`
  - `seikei`

`src/history/index.html` のようなカテゴリ直下の旧導線は残っているが、共通年表基盤の正規入口は `src/timeline/` 側。

---

## 5. Supabase と設定

- 実体: `src/js/supabase_config.js`
- 公開されている主なテーブル定数:
  - `WH_QUIZ`
  - `WH_DATES`
  - `WH_REGIONS`
  - `CHINESE`
  - `SEIKEI`
  - `ACCESS_LOG`
  - `ENGLISH_IDIOMS`

module import 用の export に加え、`window.SUPABASE_TABLES` と `window._db` も公開している。

---

## 6. Netlify / PWA 側の役割

- `netlify/edge-functions/sw.js`: アクセスログ系の beacon 受け口
- `src/service-worker.js`: App Shell キャッシュとオフライン制御
- `src/manifest.json`: PWA メタデータ
- `netlify.toml`: build と service worker header 設定
- `scripts/raindrop-to-json.js`: Raindrop CSV を `src/links/config/*.json` に変換

---

## 7. チェックとメンテナンス

- `npm run check:js`: `scripts/check-js.mjs`
- `npm run check:links`: `scripts/check-links.mjs`
- `npm run check`: JS 構文 + ローカルリンク確認
- `npm run build`: `src/` から `dist/` を生成
- `npm run tree`: リポジトリツリースナップショット更新

---

## 8. legacy / 注意点

- `src/history/index.html`, `src/quiz/components/demo.html`, `src/seikei/print.html` に `/css/theme-toggle.css` の古い参照が残る
- `src/sitemap.html` には `/learning-links/` への古い参照が残る
- `src/history/china/integration/map.html` には favicon パスの壊れた参照が残る
- `archives/` は active runtime ではない
- `public_posts/wh/*.md` は設計メモであり、現行実装の事実と混同しない方がよい
