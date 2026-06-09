# フラッシュカード テンプレート

どの科目にも使えるフラッシュカードアプリのテンプレートです。
編集するのは基本的に `data.js` だけです。

---

## ファイル構成

```
├── index.html   HTMLのみ。基本いじらない
├── style.css    デザイン。アクセントカラー（--hue）のみ変更する
├── app.js       ロジック。基本いじらない
└── data.js      ← 設定・データをここに書く
```

---

## クイックスタート（ローカル）

**Step 1. `data.js` の上部を確認**

```js
const USE_SUPABASE = false; // ← false のまま
```

**Step 2. `DECK_META` を設定**

```js
const DECK_META = {
  title: "地理総合 気候・防災", // ヘッダーとスタート画面の大見出し
  subject: "地理総合", // スタート画面の英字サブタイトル
};
```

**Step 3. `CATEGORY_STYLES` でカテゴリの色を決める**

```js
const CATEGORY_STYLES = {
  default: { text: "#2d6a4f", bg: "#e8f5e9", card: "#2d6a4f" },
  climate: { text: "#0891b2", bg: "#ecfeff", card: "#0e7490" },
  disaster: { text: "#65a30d", bg: "#f7fee7", card: "#65a30d" },
};
```

- `text` : 表面バッジの文字色
- `bg` : 表面バッジの背景色
- `card` : 裏面カードの背景色（メインカラー）

ここにないカテゴリは `default` が使われます。

**Step 4. `FILTER_DEFS` でフィルターを定義**

```js
const FILTER_DEFS = [
  { id: "all", label: "すべて", match: () => true },
  { id: "climate", label: "気候", match: (c) => c.category === "climate" },
  { id: "disaster", label: "防災", match: (c) => c.category === "disaster" },
  // 行をコメントアウトするとそのボタンが非表示になる
  //{ id: 'temp',   label: '仮',       match: c => c.category === 'temp' },
];
```

**Step 5. `CARDS` にデータを書く**

```js
const CARDS = [
  // ── 気候 ──
  {
    category: "climate",
    q: "日本の太平洋側の夏の気候の特徴は？",
    a: "高温多湿",
    sub: "南東季節風の影響。",
  },
  {
    category: "climate",
    q: "ケッペンの気候区分で Df とは？",
    a: "亜寒帯湿潤気候",
  },

  // ── 防災 ──
  {
    category: "disaster",
    q: "ハザードマップとは何か？",
    a: "自然災害の被害予測を示した地図",
  },
];
```

フィールド:
| フィールド | 必須 | 説明 |
|---|---|---|
| `category` | ✓ | `FILTER_DEFS` の `id` と一致させる |
| `q` | ✓ | 問題文（`\n` で改行可） |
| `a` | ✓ | 答え |
| `sub` | — | 補足説明 |
| `image_url` | — | 画像URL |

**Step 6. ブラウザで `index.html` を開く** — 完了。

> `USE_SUPABASE = false` のとき「追加」タブは自動で非表示になります。

---

## アクセントカラーの変更

`style.css` の先頭の `--hue` だけ変えれば UI 全体の色調が変わります。

```css
:root {
  --hue: 220; /* ← メインカラーの色相（0〜359） */
  --hue-sub: 40; /* ← グラデ終端・強調色の色相 */
}
```

カードの裏面色はカテゴリごとに `CATEGORY_STYLES.card` で個別指定するため、
`--hue` は主にボタン・プログレスバー・バッジ枠などの UI 部品に影響します。

| `--hue` | 色系             | 向いている科目     |
| ------- | ---------------- | ------------------ |
| 220     | 青（デフォルト） | 国語・世界史・社会 |
| 0       | 赤               | 数学・物理         |
| 140     | 緑               | 生物・地理         |
| 40      | 橙               | 化学・理科         |
| 280     | 紫               | 古典・文学         |

---

## Supabase 連携モード

**Step 1. テーブル作成**

```sql
CREATE TABLE your_categories (
  key   TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort  INT  NOT NULL DEFAULT 0
);

CREATE TABLE your_questions (
  id          SERIAL PRIMARY KEY,
  category    TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  explanation TEXT,
  image_url   TEXT
);
```

**Step 2. `data.js` の接続設定を変更**

```js
const USE_SUPABASE = true;
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";
const SUPABASE_TABLE_CAT = "your_categories";
const SUPABASE_TABLE_Q = "your_questions";
```

**Step 3. `CATEGORY_STYLES` を定義する**

フィルターのラベル・表示順は `your_categories` テーブルから自動生成されます。
色だけは `data.js` の `CATEGORY_STYLES` で補完します。
DBの `key` カラムと `CATEGORY_STYLES` のキーを一致させてください。
ここにないキーは `default` が使われます。

```js
const CATEGORY_STYLES = {
  default: { text: "#2d6a4f", bg: "#e8f5e9", card: "#2d6a4f" },
  your_key_1: { text: "#1d4ed8", bg: "#eff6ff", card: "#1d4ed8" },
  your_key_2: { text: "#6d28d9", bg: "#f5f3ff", card: "#6d28d9" },
};
```

`FILTER_DEFS` と `CARDS` 配列は Supabase 使用時には参照されないので、そのままでOKです。

> `USE_SUPABASE = true` にすると「追加」タブが現れ、ブラウザからカードを追加できます。

---

## キーボードショートカット

| キー      | 操作            |
| --------- | --------------- |
| `Space`   | カードを裏返す  |
| `←` / `→` | 前 / 次のカード |
| `1`       | わからない      |
| `2`       | あやふや        |
| `3`       | わかった        |
