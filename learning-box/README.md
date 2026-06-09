# learning box

高校生向け自作学習ツール集。フラッシュカードとまとめノート（穴埋め付き）をブラウザ上で学習するための静的サイト。Netlify にデプロイ済み。PWA 対応（オフライン閲覧）。

## 概要

`src/` にソースを置き、Node スクリプトで `dist/` に静的サイトを生成する。ビルドは Markdown・デッキのソース（`src/notes/` の `.md` / `content.json`、`src/flashcards/*.js` など）を `dist/` にコピーせず、生成された HTML と公開用アセットだけを出力する。ランタイムのフレームワークは使わず、Markdown のレンダリングはビルド時のみ（[marked](https://marked.js.org/)）。

一覧（`index.html`）と各ノート・各フラッシュカードページは、コンテンツのメタデータからビルド時に自動生成される。

## 開発

```bash
pnpm install
pnpm run build      # src/ → dist/ を生成（service worker 含む）
pnpm run preview    # dist/ をローカル配信
pnpm run check      # JS 構文・リンクチェック
```

Netlify は `dist/` を公開し、ビルドコマンドは `npm run build`（`netlify.toml` 参照）。

PWA の動作確認は **HTTPS または localhost** で行う（`pnpm run preview` 後、DevTools → Application → Service Workers）。

## 機能

### フラッシュカード (`flashcards/<slug>.html`)

- スタート画面でカテゴリ・問題数を選択してから学習開始
- カードを裏返して「わかった / あやふや / わからない」の3段階で自己採点
- 一周完了後に結果サマリーと教科別ブレークダウンを表示
- 「✗ △ のみ復習」で苦手カードだけ再出題
- キーボードショートカット（`←` `→` 移動、`Space` で裏返す、`1`/`2`/`3` で採点）

**カードデータの置き場所:** 編集は `src/flashcards/<slug>.js`。ビルド時に `DECK_META` / `CARDS` などが各 HTML の `<script>` に埋め込まれ、本番では `flashcards/*.js` は公開されない。

### まとめノート (`notes/<slug>.html`)

- ビルド済み HTML の「まとめ」タブ（Markdown はビルド時に変換済み）
- `⟦⟦語句⟧⟧` 記法の穴埋めクイズ（クリックで表示）タブ
- ユニット URL: `notes/<slug>.html#01`（`#` + 2桁のファイル名）

### PWA

- `src/images/` にアイコン・スクリーンショットを置く（ビルドで `manifest.webmanifest` を自動生成）
  - 例: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `screenshot-wide.png`, `screenshot-narrow.png`
  - ファイル名に `icon` / `screenshot` を含めると manifest に拾われる
- ビルド時に `dist/service-worker.js` を生成し、`dist/` 内の全ファイルをプリキャッシュ
- 各ページから `js/pwa.js` で Service Worker を登録

### 旧 URL

ブックマーク用に Netlify の `src/_redirects` で転送する（例: `flashcard.html?slug=xxx` → `flashcards/xxx.html`）。

## ファイル構成

```
.
├── src/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── _redirects              # Netlify リダイレクト
│   ├── subject-colors.json
│   ├── css/
│   ├── js/
│   │   ├── note-static.js
│   │   ├── flashcard-app.js
│   │   └── pwa.js
│   ├── notes/<slug>/
│   │   ├── content.json
│   │   └── 01.md, 02.md …
│   └── flashcards/<slug>.js    # ソース（ビルドで HTML に埋め込み）
├── templates/
├── scripts/
└── dist/                       # 公開ディレクトリ
```

## コンテンツの追加方法

### まとめノート

1. `src/notes/<slug>/` を作成し `content.json` を置く
2. `01.md`, `02.md`, … を追加（先頭 `#` がユニットタイトル）
3. `pnpm run build`

### フラッシュカード

1. `src/flashcards/<slug>.js` に `DECK_META` と `CARDS` を定義
2. `pnpm run build` → `dist/flashcards/<slug>.html` にデータ込みで出力

```js
const DECK_META = {
  title: "カードセット名",
  subject: "教科名",
  tags: ["タグ1"],
  updated: "YYYY-MM-DD",
};

const CARDS = [
  // { front, back, category, … }
];
```

### 教科別カラー

`src/subject-colors.json` を編集し、ビルドで `dist/css/subject-colors.css` に反映。

## 穴埋め記法

`⟦⟦…⟧⟧` — まとめタブではハイライト、穴埋めタブではクリックまで非表示。生成ツール: [cloze-builder](https://451-docs.netlify.app/toolbox/cloze-builder)。

## 技術スタック

- HTML / CSS / JavaScript
- Node.js ビルド: marked、esbuild、html-minifier-terser
- Service Worker（ビルド時生成）
- Netlify

詳細な移行メモは `plan.md` を参照。
