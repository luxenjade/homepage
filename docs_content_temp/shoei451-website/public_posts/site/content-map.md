---
title: shoei451-website コンテンツマップ
date: 2026-04-03
description: 各カテゴリと主要ページの整理
thumbnail:
category: developer
components.katex: false
components.highlight: true
published: true
---

# shoei451-website コンテンツマップ

最終更新: 2026-04-03

---

## 1. サイト共通ページ

- `src/index.html`: ホーム
- `src/about/`: プロフィール、タグ、ソーシャル、外部プロジェクト表示
- `src/links/`: 学習リンク集
- `src/privacy-policy.html`: ポリシー
- `src/sitemap.html`: サイト全体のリンク一覧
- `src/404.html`: 共通エラーページ

---

## 2. History

- `src/history/list.json` がカテゴリデータの入口
- 主な公開導線:
  - 世界史クイズ（`/quiz/?slug=wh-year-to-event`, `/quiz/?slug=wh-event-to-year`）
  - 中国史クイズ（`/quiz/?slug=china-era`）
  - 世界史年表（legacy: `/history/index.html`）
  - 新版年表（`/timeline/?slug=world-history`）
  - 中国王朝史年表（`/timeline/?slug=china-history`）
  - 中国文化史クイズ（`/history/china`）

---

## 3. Geography

- `src/geography/list.json` が入口
- 主なページ:
  - `src/geography/china/`
  - `src/geography/us-state-location-quiz.html`
  - `src/geography/africa-independence-atlas/`

---

## 4. Seikei

- `src/seikei/list.json` が入口
- 主なページ:
  - `/seikei/japan-constitution-quiz.html`
  - `/seikei/print.html`
  - `/timeline/?slug=seikei`
  - `/quiz/?slug=seikei`

---

## 5. Miscellaneous

- `src/miscellaneous/list.json` が入口
- 主な内容:
  - 生物基礎語句確認 Forms
  - 地質年代クイズ
  - Vintage イディオムクイズ (`/quiz/?slug=idiom`)
  - 16進数クイズ (`/quiz/?slug=hex`)
  - Sudoku JS note
  - 衣類の取り扱い表示クイズ

---

## 6. Playground

`src/playground/` はカテゴリ一覧ベースではなく、独立した実験的コンテンツ置き場として見るのが近い。

- `src/playground/dodge-game/`: Canvas + Web Audio API のアクションゲーム
- `src/playground/jodoushi/`: 助動詞学習ツール
- `src/playground/yaju/`: ネタ寄りの独立コンテンツ

---

## 7. Projects / About / Links

- `src/projects/list.json`: 外部プロジェクト一覧データ
- `src/about/`: `shoei451.json`, `bio.md`, `projects/list.json` を組み合わせて描画
- `src/links/`: 独立したリンク集 UI

---

## 8. 共通基盤との対応

- クイズ導線は基本的に `src/quiz/` に集約
- 年表導線は基本的に `src/timeline/` に集約
- カテゴリ一覧導線は `src/sub-index.html` + `src/*/list.json` に集約
- 一部 legacy ページはカテゴリ直下に残っている
