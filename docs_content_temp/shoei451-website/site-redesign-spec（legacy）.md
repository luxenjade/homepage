# サイトリデザイン設計書

作成日: 2026-03-30
対象リポジトリ: `Shoei451/shoei451-website`

---

## 対象ファイル

### 直接リデザインするもの

- `index.html`
- `sub-index.html` + `js/sub-index-init.js`
- `css/common.css`
- `css/sub-index.css`
- `css/theme-toggle.css`
- `404.html`
- `learning-links.html`

### 間接的に影響を受けるもの（共通CSS変数の変更による）

- `timeline/style.css`
- `quiz-components/quiz-shell.css`
- `history/styles/theme-chinese.css`

### 新規作成するもの

- `js/nav.js` — ナビバー inject
- `css/base.css` — 全ページ共通の基盤CSS（`common.css` を置き換え）
- `about.html`
- `sitemap.html`
- `privacy-policy.html`

---

## デザイン方針

### カラーパレット（全ページ統一）

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8f9fa; /* Bootstrap gray-100 */
  --color-border: #dee2e6; /* Bootstrap gray-300 */
  --color-text-primary: #1a1d23; /* 青みがかった黒 */
  --color-text-secondary: #6c757d; /* Bootstrap secondary */
  --color-accent: #faba40; /* サイト共通アクセント */
  --color-accent-dark: #e0a030; /* hover用 */
  --color-accent-text: #7a5000; /* アクセント上のテキスト */
}

body.dark {
  --color-bg: #1a1d23;
  --color-surface: #242830;
  --color-border: #373d47;
  --color-text-primary: #f1f3f5;
  --color-text-secondary: #9aa0a8;
  --color-accent: #faba40;
  --color-accent-dark: #ffc958;
  --color-accent-text: #1a1d23;
}
```

`--qz-*` 変数はクイズ専用として維持。`timeline/style.css` の `--color-*` はこの体系に統合（ファイルを削除して `base.css` に一本化）。

### レイアウト方針

- **左寄せ**：`text-align: center` を基本から外す。コンテンツは左寄せ、コンテナは `max-width` で制限
- **コンパクトなヘッダー**：現行の `padding: 100px` 級の大ヘッダーを廃止。高さ60px前後のシンプルなページタイトルエリアに
- **Bootstrap グリッド**：カードレイアウトは `row/col` に統一。独自の `cards-container` は廃止
- **グラデーション廃止**：`background: linear-gradient(...)` を全廃。単色ベース

---

## ナビバー（`js/nav.js`）

### 実装方式

`theme-toggle.js` と同じ inject パターン。各HTMLに `<div id="nav-container"></div>` を置き、`nav.js` がナビバーHTMLを挿入する。

### ナビバーの構造

```html
<nav class="navbar navbar-expand-md" id="site-nav">
  <div class="container-fluid">
    <!-- ブランド -->
    <a class="navbar-brand" href="/index.html">Shoei451</a>

    <!-- モバイルトグル -->
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navMenu"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- リンク群 -->
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" href="/sub-index.html?slug=history">歴史</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/sub-index.html?slug=seikei">政経</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/sub-index.html?slug=geography">地理</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/others/">その他</a>
        </li>
      </ul>

      <!-- 右側：テーマトグル -->
      <div id="theme-toggle-container"></div>
    </div>
  </div>
</nav>
```

- [ ] ナビバー内のリンクの中身については別途検討

### アクティブリンクの自動検出

```js
// nav.js 内
const path = location.pathname + location.search;
document.querySelectorAll("#site-nav .nav-link").forEach((link) => {
  if (path.includes(link.getAttribute("href"))) {
    link.classList.add("active");
  }
});
```

### 読み込み順序

```html
<!-- 各HTMLの <head> -->
<link rel="stylesheet" href="/css/base.css" />

<!-- Bootstrap CSS（CDN） -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
/>

<!-- <body> 先頭 -->
<div id="nav-container"></div>

<!-- </body> 直前 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/nav.js"></script>
<script src="/js/theme-toggle.js"></script>
```

テーマトグルは `nav.js` が `#theme-toggle-container` を用意してから `theme-toggle.js` が inject する順序を保証する。

---

## `sub-index-init.js` の変更

### 現行の問題

`document.body.innerHTML` を丸ごと書き換えるため、HTMLに書いたナビバー・フッターが消える。

### 変更方針

書き換えターゲットを `<main id="page-content">` だけに限定する。

```html
<!-- sub-index.html の構造 -->
<body>
  <div id="nav-container"></div>

  <main id="page-content">
    <!-- sub-index-init.js はここだけを書き換える -->
  </main>

  <footer id="site-footer"></footer>

  <script src="...bootstrap..."></script>
  <script src="/js/nav.js"></script>
  <script src="/js/theme-toggle.js"></script>
  <script src="/js/sub-index-init.js"></script>
</body>
```

```js
// sub-index-init.js の変更点
// 変更前
document.body.innerHTML = `...全体のHTML...`;

// 変更後
document.getElementById("page-content").innerHTML = `...コンテンツのみ...`;
```

### `list.js` → `list.json` 化（完了済み）に合わせた変更

```js
// 変更前（script inject + Function() ハック）
const script = document.createElement("script");
script.src = slug + "/list.js";
script.onload = () => buildPage(window.PAGE_CONFIG);

// 変更後（fetch ベース）
const res = await fetch(slug + "/list.json");
const cfg = await res.json();
buildPage(cfg);
```

---

## カードコンポーネントの Bootstrap 化

### 現行

独自の `.card` / `.cards-container` クラス。CSS が200行以上。

### 変更後

Bootstrap の `card` コンポーネントをベースにして、アクセントカラーだけ上書き。

```html
<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
  <div class="col">
    <a href="..." class="card h-100 text-decoration-none site-card">
      <div class="card-body">
        <img src="..." class="site-card__icon mb-3" alt="" />
        <h5 class="card-title">タイトル</h5>
        <p class="card-text text-secondary">説明文</p>
      </div>
    </a>
  </div>
</div>
```

```css
/* base.css に追加するカード上書きのみ */
.site-card {
  border-color: var(--color-border);
  background: var(--color-surface);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}

.site-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.site-card__icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
}
```

---

## `index.html` の構造

### 現行の問題

- 大きすぎるヘッダー（`padding: 100px`）
- カウントダウンカードが `grid-column: 1 / -1` で幅を独占
- テーマトグルが `position: fixed` で他要素と干渉

### 新しい構造

```
[ナビバー]          ← nav.js が inject
[ページヘッダー]    ← コンパクト。タイトル + 短い説明文のみ
[カウントダウン]    ← 折りたたみ可能なセクション（Bootstrap collapse）
[セクション群]      ← Bootstrap グリッドでカードを配置
[フッター]          ← 新規追加
```

---

## 新規追加ページ

### `about.html`

- 短いbio（2-3文）だけindexに残し、about.htmlに折りたたみ式の長めのbio
- 連絡先・SNSリンク（linktree の代替）
- このサイトについての説明
- project/list.jsonもここに統合する(my projects section)

### `privacy-policy.html`

- アクセスログ（`sendBeacon` → Supabase）で取得している情報の明記
- 用途の説明（学習ツールの利用状況把握）

### `sitemap.html`

- 全ページのリンク一覧
- `list.json` から動的生成できる部分は JS で自動生成

---

## フッター（`js/footer.js` or `nav.js` に統合）

各サブフォルダ(もしくはそれ相当)のリンクを貼るor動的生成

```html
<footer class="site-footer mt-auto py-4">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-6 text-secondary small">
        © 2026 Shoei Okamoto —
        <a href="/privacy.html">プライバシーポリシー</a> ·
        <a href="/about.html">About</a> ·
        <a href="/sitemap.html">サイトマップ</a>
      </div>
      <div class="col-md-6 text-md-end small text-secondary">
        <a href="mailto:okamotoshoei451@gmail.com">okamotoshoei451@gmail.com</a>
      </div>
    </div>
  </div>
</footer>
```

---

## CSS 変数の移行マップ

リデザイン後に各ファイルで変数名をどう読み替えるか。

| 旧変数（common.css） | 新変数（base.css）                     |
| -------------------- | -------------------------------------- |
| `--theme`            | `--color-bg`                           |
| `--entry`            | `--color-surface`                      |
| `--primary`          | `--color-text-primary`                 |
| `--secondary`        | `--color-text-secondary`               |
| `--accent`           | `--color-accent`                       |
| `--accent-text`      | `--color-accent-text`                  |
| `--border`           | `--color-border`                       |
| `--shadow`           | （Bootstrap の shadow utility に移行） |

`--qz-*` 変数はクイズ専用として変更なし。

---

## 実装順序

1. `base.css` を作成（`common.css` の変数体系を新体系に置き換え）
2. `nav.js` を実装（ナビバー inject）
3. `index.html` リデザイン
4. `sub-index-init.js` 変更（`body` 全体書き換え → `#page-content` のみ）
5. `sub-index.html` リデザイン
6. `404.html`・`learning-links.html` を新 CSS に対応
7. `about.html`・`privacy.html`・`sitemap.html` 新規作成
8. `timeline/style.css` を `base.css` に統合
9. `history/styles/theme-chinese.css` の変数を新体系に移行

---

## 積み残し・未決定事項

- カウントダウンカードをナビバーに統合するか、折りたたみセクションとして残すか
- `about.html` の内容（bio・SNSリンクは別途確認）
- `sitemap.html` の自動生成範囲（`list.json` 以外のページをどう収集するか）
- `common.css` を `base.css` に置き換えた後、`@import "./theme-toggle.css"` の扱い（`base.css` に統合するか、独立ファイルとして残すか）
- Bootstrap を npm パッケージとして使うか CDN のみにするか（現在 `package.json` に依存として存在するが実際の読み込みは未確認）
  - →CDNのみにすることに決定
