---
title: 世界史データ配信設計まとめ
date: 2026-03-26
description: supabaseからjsへの移行についての検討
thumbnail:
category: history-quiz-dev
components.katex: false
components.highlight: true
published: true
---

# 世界史データ配信設計まとめ（data.js 方針）

最終更新: 2026-03-24

---

# 目的

Supabase を「書き込みの正本（source of truth）」として扱い、
フロントエンドには **静的な data.js** を配信することで、以下を実現する。

- Supabase 停止・凍結時でもサイトは動作し続ける
- CDN キャッシュによる高速表示
- フロントのロジックを単純化
- 将来の機能拡張に耐えるデータ構造

---

# アーキテクチャ（提出箱モデル）

```
管理者（admin/）
        ↓
Supabase に INSERT / UPDATE
        ↓
GitHub Actions が build
        ↓
Supabase → transform → data.js 生成
        ↓
Netlify CDN で配信
        ↓
フロントは data.js を読むだけ
```

重要原則:

```
DB = 完全情報（編集・管理用）
data.js = 配信用（安定・軽量）
```

---

# data.js の役割

これは **データベースではない**。

```
描画専用のキャッシュ
```

つまり:

- 書き込みしない
- ソートしない
- 計算しない
- API として使わない

---

# data.js に残すフィールド（最終決定）

以下は「意味を持つ情報」として保持する。

```
id
year
yearEnd

dateType
fullDate

event
description

region
field

type

wikiUrl
wikiScore
```

---

# 残す理由（要点）

## wiki_score

用途:

- 情報の信頼度管理
- 要確認データ抽出
- 品質フィルタ

例:

```
data.filter(e => e.wikiScore >= 4)
```

---

## wiki_url

用途:

- 外部資料へのリンク
- 詳細ページ導線

特徴:

```
小さいが価値が高い
```

---

## date_type

値:

```
year
full
circa
```

用途:

- 表示ロジックの単純化
- 曖昧な年代の明示

---

## full_date

用途:

- 日単位イベント
- カレンダー表示
- 将来の精密年表

---

## field

値:

```
政治
経済
文化・宗教
社会
外交・戦争
```

用途:

- 分野別学習
- フィルタ
- 出題分類

これは「歴史の見方」を定義する重要軸。

---

# data.js に入れないフィールド

```
created_at
updated_at
memo
```

理由:

```
運用用の情報だから
```

---

# transform の責任

transform は最重要コンポーネント。

役割:

```
DB の構造 → フロント用構造
```

---

# transform 例

```js
export function transformData(rows) {
  return rows.map((r) => ({
    id: r.id,

    year: r.year,
    yearEnd: r.year_end ?? null,

    dateType: r.date_type,
    fullDate: r.full_date ?? null,

    event: r.event,
    description: r.description ?? "",

    region: r.region ?? [],
    field: r.field ?? null,

    type: r.record_type,

    wikiUrl: r.wiki_url ?? null,
    wikiScore: r.wiki_score ?? null,
  }));
}
```

---

# fetch クエリ（推奨）

```js
.select(`
  id,
  year,
  year_end,
  date_type,
  full_date,
  event,
  description,
  region,
  field,
  record_type,
  wiki_url,
  wiki_score
`)
```

---

# ソート（必須）

```js
.order("year", { ascending: true })
.order("year_end", { ascending: true })
.order("id", { ascending: true })
```

理由:

```
安定ソートの保証
```

---

# data.js の最終形式

```js
// Auto-generated
// Generated: 2026-03-24T12:00:00Z
// Records: 1243

window.WORLD_HISTORY_DATA = [
  {
    id: 1,

    year: -221,
    yearEnd: null,

    dateType: "year",
    fullDate: null,

    event: "秦が中国を統一",
    description: "",

    region: ["china"],
    field: "政治",

    type: "event",

    wikiUrl: null,
    wikiScore: 4,
  },
];
```

---

# ファイル配置（推奨）

```
scripts/
  build/
    world-history/
      fetch.js
      transform.js
      write.js
      build-world-history-data.js

public/
  data/
    world-history-data.js
```

---

# ビルドの安全設計（重要）

絶対条件:

```
失敗したら上書きしない
```

---

# 安全ガード例

```js
if (!rows || rows.length === 0) {
  throw new Error("No data fetched from Supabase");
}
```

---

# サイズ目安

```
1000件 ≒ 200〜300KB
```

これは:

- CDN キャッシュ可能
- ブラウザ問題なし
- fetch 不要

---

# 将来の拡張ライン

## データ数が増えた場合

```
3000件以上
```

で検討:

```
core
persons
periods
```

への分割。

ただし現段階では:

```
単一ファイルで十分
```

---

# 設計原則（最重要）

```
軽量化より意味保持
```

削る基準は:

```
使うか？
```

ではなく:

意味があるか？

```

---

# 最終結論

この設計は:

```

安定性
拡張性
移行性

```

のバランスが非常に良い。

特に重要なのは:

```

Supabase を止めてもサイトが止まらない

```

という点である。
```
