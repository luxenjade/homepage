# shoei451-website — アーキテクチャ概要

最終更新: 2026-03-31
本番: https://shoei451.netlify.app
リポジトリ: `Shoei451/shoei451-website`

---

## スタック

| 層             | 技術                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| フロントエンド | Vanilla HTML / CSS / JS                                                          |
| スタイル基盤   | `css/base.css` + Bootstrap icons （/js/icons.jsで管理）                          |
| データ         | Supabase Project 1 (`gjuqsyaugrsshmjerhme`)                                      |
| ホスティング   | Netlify                                                                          |
| アクセスログ   | Netlify Edge Function (`/netlify/edge-functions/sw.js`) → Supabase `access_logs` |

---

## ページ構成

### ルートページ

| ファイル              | 役割                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `index.html`          | トップページ。カウントダウン + セクション別カードグリッド              |
| `sub-index.html`      | サブインデックス共通シェル。`?slug=history` 等で動的にコンテンツを生成 |
| `404.html`            | 404エラーページ                                                        |
| `about.html`          | bio・連絡先・プロジェクト一覧                                          |
| `privacy-policy.html` | アクセスログの取得内容・用途の説明                                     |
| `sitemap.html`        | 全ページリンク一覧                                                     |

### サブインデックス（`sub-index.html?slug=*`）

各フォルダに `list.json` を置き、`js/sub-index-init.js` が fetch してカード生成。

| slug            | フォルダ         |
| --------------- | ---------------- |
| `history`       | `history/`       |
| `seikei`        | `seikei/`        |
| `geography`     | `geography/`     |
| `miscellaneous` | `miscellaneous/` |

### クイズ（`quiz/index.html?slug=*`）

1ファイルのシェル + slug ごとの config ファイルで全クイズを統合。

```
quiz/
├── index.html       ← 共通シェル
├── logic.js         ← 共通ロジック（config に依存しない）
└── config/
    ├── world-year-to-event.js
    ├── world-event-to-year.js
    ├── china-era.js
    ├── seikei.js
    ├── idiom.js
    ├── capitals.js
    └── hex.js
```

`QUIZ_CONFIG.answerType` が `'choice'` なら `choice-buttons.js`、`'text'` なら `text-input.js` を動的ロード。

### 年表（`timeline/index.html?slug=*`）

同様のパターン。

```
timeline/
├── index.html
├── script.js
└── config/
    ├── china-history.js   ← wh_dates + region=['china']
    ├── world-history.js   ← wh_dates（world_history_quiz 移行後に有効）
    └── seikei.js          ← seikei_events
```

---

## 共通 JS

| ファイル                | 役割                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `js/nav.js`             | ナビバー + フッターを inject。`theme-toggle.js` より先に読み込む     |
| `js/theme-toggle.js`    | ダークモード切替ボタンを inject。`pref-theme` を localStorage に保存 |
| `js/sub-index-init.js`  | `sub-index.html` 用。slug から `list.json` を fetch してカードを生成 |
| `js/supabase_config.js` | Supabase クライアント生成。`db`・`tables` を export                  |

---

## CSS

| ファイル                               | 役割                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| `css/base.css`                         | 全ページ共通。ナビバー・フッター・カード・テーマトグルを含む |
| `quiz/components/quiz-shell.css`       | クイズ画面専用。`--qz-*` 変数体系                            |
| `timeline/style.css`                   | 年表ページ専用                                               |
| `history/china/culture-quiz/style.css` | 中国文化史クイズ専用                                         |

---

## CSS 変数体系

### `base.css`（全ページ共通）

```css
--color-bg, --color-surface, --color-border
--color-text-primary, --color-text-secondary
--color-accent (#faba40), --color-accent-dark, --color-accent-text
```

### `quiz-shell.css`（クイズ専用・変更しない）

```css
--qz-accent, --qz-accent-dark, --qz-accent-light, --qz-accent-ring
--qz-bg, --qz-surface, --qz-surface-2
--qz-text, --qz-text-sub, --qz-border
--qz-correct, --qz-correct-bg, --qz-incorrect, --qz-incorrect-bg
```

---

## Supabase テーブル

| 定数名           | テーブル名           | 用途                                 |
| ---------------- | -------------------- | ------------------------------------ |
| `WH_DATES`       | `wh_dates`           | 世界史・中国史イベント（統合先）     |
| `WH_QUIZ`        | `world_history_quiz` | 旧世界史クイズデータ（移行待ち）     |
| `CHINESE`        | `chinese_history`    | 旧中国史データ（移行済み、DROP待ち） |
| `SEIKEI`         | `seikei_events`      | 政経年表データ                       |
| `ACCESS_LOG`     | `access_logs`        | アクセスログ                         |
| `ENGLISH_IDIOMS` | `english_idioms`     | イディオムクイズデータ               |

`wh_dates` スキーマ: `year`（負数=紀元前）、`year_end`、`record_type`（event/period/person）、`region`（text[]）、`field`、`event`、`description`、`wiki_url`、`wiki_score`、`date_type`、`memo`

---

## HTML ページテンプレート（標準）

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ページ名 — Shoei451</title>

    <!-- フラッシュ防止 -->
    <script>
      (function () {
        const t = localStorage.getItem("pref-theme");
        if (
          t === "dark" ||
          (!t && matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
          document.documentElement.classList.add("dark");
        }
      })();
    </script>

    <link rel="stylesheet" href="/css/base.css" />
  </head>
  <body>
    <div id="nav-container"></div>

    <main class="container py-4">
      <!-- コンテンツ -->
    </main>

    <footer id="site-footer"></footer>

    <script src="/js/nav.js"></script>
    <script src="/js/theme-toggle.js"></script>

    <script>
      if (document.documentElement.classList.contains("dark")) {
        document.body.classList.add("dark");
      }
    </script>
  </body>
</html>
```

---

## 技術メモ

- Supabase pb key はコミット済み・公開前提（RLS で制御）
- `quiz/logic.js` と `timeline/script.js` は `window._db` を前提とする。`js/supabase_config.js` が CDN Supabase より後に読み込まれた場合は `window._db` が未定義になるため、読み込み順に注意
- `wh_dates` の region フィルタ: `.contains('region', ['china'])` で動作確認済み
- `list.json` の `icon` フィールド: `bi-xxx` → Bootstrap Icon、`*.png` 等 → img、絵文字 → 非表示（xss-resistant）
