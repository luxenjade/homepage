---
title: shoei451-website 現況スナップショット
date: 2026-04-03
description: shoei451-website の現行構成と当面の論点
thumbnail:
category: developer
components.katex: false
components.highlight: true
published: true
---

# Site Status — shoei451-website

最終更新: 2026-04-03

---

## 現在の構成

- ルートは静的 HTML/CSS/JS サイトで、`src/` から `dist/` へビルドして Netlify にデプロイ
- カテゴリ導線は `src/sub-index.html?slug=...` + `src/js/sub-index-init.js`
- 共通クイズ基盤は `src/quiz/`、共通年表基盤は `src/timeline/`
- 共通ナビ・フッターは `src/js/nav.js`、テーマ切替は `src/js/theme-toggle.js`
- データ取得が必要なページは `src/js/supabase_config.js` を経由して Supabase を参照
- PWA は `src/service-worker.js`, `src/manifest.json`, `appstore-images/`, `netlify.toml` で管理
- アクセスログは `netlify/edge-functions/sw.js`

---

## 主要コンテンツ領域

- `src/history/`: 世界史導線、歴史総合フォーム、中国史文化クイズ
- `src/geography/`: 中国地理、アメリカ州、アフリカ独立 atlas
- `src/seikei/`: 日本国憲法クイズ、政経リスト、印刷ページ
- `src/miscellaneous/`: 理科基礎、英語イディオム、情報 I、家庭基礎
- `src/playground/`: DODGE、助動詞ツール、yaju
- `src/about/`, `src/links/`, `src/projects/`: サイト共通の補助ページ

---

## 直近で確認できた更新点

- `src/service-worker.js` と `src/manifest.json` を中心に PWA 対応が追加済み
- `appstore-images/` 配下に Android / iOS / Windows 向けアイコンが追加済み
- `src/links/config/` に複数カテゴリの JSON が追加され、リンク集が拡充済み
- `scripts/raindrop-to-json.js` で CSV からリンク集 JSON を生成できる状態
- `src/history/china/integration/` の古い計画メモは `README.md` と `md/progress.md` に統合済み

---

## まだ意識しておくべき論点

- `src/history/index.html` は旧 world-history timeline として残っている
- `src/history/list.json` でも新版年表を「旧データ移行中」と説明している
- `src/timeline/admin/wh-admin-legacy.html` は legacy admin ページとして残存
- `npm run check` は既知のリンク切れ 5 件で止まる
  - `src/history/china/integration/map.html` -> `images/3dynasties_favicon.png`
  - `src/history/index.html` -> `/css/theme-toggle.css`
  - `src/quiz/components/demo.html` -> `/css/theme-toggle.css`
  - `src/seikei/print.html` -> `/css/theme-toggle.css`
  - `src/sitemap.html` -> `/learning-links/`
- `public_posts/wh/*.md` は個別の世界史データ設計メモで、実装済みとは限らない

---

## 参照先

- `public_posts/site/site-overview.md`: サイト全体像
- `public_posts/site/content-map.md`: コンテンツ一覧
- `public_posts/site/shared-systems.md`: 共通基盤
- `public_posts/site/maintenance-status.md`: 運用と既知課題
