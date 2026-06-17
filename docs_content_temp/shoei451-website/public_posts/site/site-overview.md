---
title: shoei451-website 全体概要
date: 2026-04-03
description: shoei451-website のサイト構成と主要導線の要約
thumbnail:
category: developer
components.katex: false
components.highlight: true
published: true
---

# shoei451-website 全体概要

最終更新: 2026-04-03

---

## 1. これは何のサイトか

`shoei451-website` は、Shoei451 個人の学習用サイトであり、以下を 1 つのリポジトリで運用している。

- 教科別の学習ツール
- クイズ / 年表の共通ランタイム
- サイト共通ページ（About, Privacy Policy, Site Map, 404）
- 小規模な実験的コンテンツ (`src/playground/`)

技術スタックは基本的に Vanilla HTML/CSS/JS で、ホスティングは Netlify。ソースは `src/`、配信用ビルドは `dist/` を使う。

---

## 2. 現在のトップレベル導線

### サイト共通ページ

- `src/index.html`: ホーム
- `src/sub-index.html`: slug ごとのカテゴリ一覧ページ
- `src/about/`: プロフィールと外部プロジェクト紹介
- `src/links/`: 外部学習リンク集
- `src/privacy-policy.html`: データ取り扱い
- `src/sitemap.html`: サイトマップ
- `src/404.html`: 共通 404 ページ

### 学習カテゴリ

- `src/history/`
- `src/geography/`
- `src/seikei/`
- `src/miscellaneous/`
- `src/projects/`
- `src/playground/`

---

## 3. 現在の情報設計

カテゴリページは `src/sub-index.html?slug=...` を共通エントリにし、各ディレクトリの `list.json` を読んで表示する構成が基本になっている。

このため、サイト全体の導線は以下の 2 段構えで見ると把握しやすい。

1. `list.json` を読むカテゴリ一覧導線
2. `src/quiz/`, `src/timeline/`, 個別 HTML ページへ分岐する実行導線

---

## 4. 現在の共通ランタイム

### クイズ

- 実体: `src/quiz/`
- 設定: `src/quiz/config/*.js`
- 役割: 4択 / 入力型クイズの共通 UI と進行管理

### 年表

- 実体: `src/timeline/`
- 設定: `src/timeline/config/*.js`
- 役割: インタラクティブ年表の共通描画

### サイト共通 UI

- `src/js/nav.js`: ナビバーとフッターの inject、Service Worker 登録
- `src/js/theme-toggle.js`: テーマ切替
- `src/css/base.css`: 共通スタイル基盤

---

## 5. データと配信

- 静的ページは `src/` から `dist/` へビルドして Netlify で配信
- 一部ページは `src/js/supabase_config.js` を経由して Supabase を参照
- アクセスログ系は `sendBeacon('/api/sw?...')` -> `netlify/edge-functions/sw.js`
- PWA は `src/service-worker.js`, `src/manifest.json`, `appstore-images/`, `netlify.toml` で構成
- リンク集データは `scripts/raindrop-to-json.js` で `src/links/config/*.json` に変換する

---

## 6. 現在の legacy / 移行中領域

- `src/history/index.html` は legacy な world-history timeline
- `src/timeline/admin/wh-admin-legacy.html` は legacy admin ページ
- `archives/` は旧スクリプトや旧資産の退避先
- `public_posts/wh/*.md` は世界史データ設計の専門メモで、サイト全体説明の正本ではない

---

## 7. まず何を読めばよいか

- サイト全体像を掴む: `public_posts/site/site-overview.md`
- 具体的なページ一覧を見る: `public_posts/site/content-map.md`
- 技術的な共通基盤を見る: `public_posts/site/shared-systems.md`
- 運用上の注意点を見る: `public_posts/site/maintenance-status.md`
