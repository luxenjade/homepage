---
title: shoei451-website 運用・既知課題
date: 2026-04-03
description: 現行チェック方法と legacy 領域の整理
thumbnail:
category: developer
components.katex: false
components.highlight: true
published: true
---

# shoei451-website 運用・既知課題

最終更新: 2026-04-03

---

## 1. 基本チェック

```bash
git status --short
git log --date=short --stat -n 8
npm run check
npm run tree
```

補助確認:

```bash
rg -n "legacy|旧データ移行中|wh-admin-legacy" src/history src/timeline README.md
rg --files
```

---

## 2. 2026-04-03 時点で確認したこと

- ルート `README.md` は `src/` / `dist/` / `links/` / PWA 前提に更新済み
- `src/manifest.json`, `src/service-worker.js`, `appstore-images/`, `netlify.toml` で PWA 配信が構成されている
- `src/links/config/` にリンク集 JSON が追加され、`scripts/raindrop-to-json.js` が変換元スクリプトとして存在する
- `src/history/china/integration/` の古い計画メモは `README.md` と `md/progress.md` に集約済み

---

## 3. 既知の課題

### link check の既知失敗

`npm run check` は現在、以下 5 件で止まる。

- `src/history/china/integration/map.html` -> `images/3dynasties_favicon.png`
- `src/history/index.html` -> `/css/theme-toggle.css`
- `src/quiz/components/demo.html` -> `/css/theme-toggle.css`
- `src/seikei/print.html` -> `/css/theme-toggle.css`
- `src/sitemap.html` -> `/learning-links/`

いずれも repo の既存問題で、site-wide docs 更新とは切り分けて扱う。

### legacy として残っている領域

- `src/history/index.html`
- `src/timeline/admin/wh-admin-legacy.html`
- `archives/`

---

## 4. 文書運用ルール

- サイト全体説明は `public_posts/site/` に集約する
- 旧パス前提の断片メモは増やさない
- `todo.md` はサイト全体の現況スナップショットに限定する
- 個別実験 (`src/playground/`) の詳細は、その配下の README / progress に任せる
- 設計案と実装済み事実を混ぜない

---

## 5. 今後 docs を更新するときの優先順

1. まず repo 内 `README.md` と `tree.md` 相当の最新構造を確認
2. 次に `src/history/list.json`, `src/miscellaneous/list.json`, `src/seikei/list.json`, `src/projects/list.json` を確認
3. 共有ランタイムや PWA の変更があれば `public_posts/site/shared-systems.md` を更新
4. 新しいカテゴリや主要ページが増えたら `public_posts/site/content-map.md` を更新
5. legacy 状況が変わったらこのファイルと `todo.md` を更新
