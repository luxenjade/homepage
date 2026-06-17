---
title: wh_dates テーブル設計ドキュメント
date: 2026-03-26
description: 新テーブル "wh_dates" の構想
thumbnail:
category: history-quiz-dev
components.katex: false
components.highlight: true
published: true
---

# `wh_dates` テーブル設計ドキュメント

**作成日:** 2026-03-18  
**最終更新:** 2026-03-20  
**プロジェクト:** Supabase Project 1 (`gjuqsyaugrsshmjerhme`)  
**対象サイト:** `shoei451.netlify.app`（`Shoei451/shoei451-website`）

---

## 1. 設計の背景と目的

### 旧テーブルの問題

| テーブル               | 件数    | 問題                                                                                |
| ---------------------- | ------- | ----------------------------------------------------------------------------------- |
| `world_history_quiz`   | 1,356件 | `chapter`/`period`で独自分類、他サイトで再利用不可                                  |
| `world_history_events` | 4,413件 | `category`に地域と時代が混在、「その他」が全体の60%、`keep`カラムが未使用のまま放置 |
| `chinese_history`      | -       | 独自カテゴリ体系で `wh_dates` に統合不可                                            |

### 新設計のゴール

- **1テーブルで全サイトに対応**：`region` フィルタで中国史・イスラーム史・ヨーロッパ史などを使い分ける
- **点・期間・人物を同一テーブルで管理**：`record_type` で区別
- **フラッシュカード・クイズUIに最適な構造**：`event`（短い名詞形）と `description`（補足説明）の二段構え
- **提出箱モデルとの親和性**：Supabaseは書き込みの正本、フロントはbuild生成JSONを読むだけ

---

## 2. アーキテクチャ（提出箱モデル）

```
① 管理者が admin/index.html からイベントを追加
        ↓
② Supabaseに保存（wh_dates への INSERT）
        ↓
③ [月1 cron] GitHub Actions → Wikipedia Pageviews API → wiki_score を UPDATE
        ↓
④ build時にSupabaseから全データ取得
        ↓
⑤ 静的JSON生成 → Netlify CDN配信
        ↓
⑥ フロント（フラッシュカード・クイズ・年表）はJSONを読むだけ
```

**Supabaseが停止しても⑥は動き続ける**（提出箱モデルの本質）。

---

## 3. テーブルスキーマ

### `wh_regions`（地域マスタ）

```sql
CREATE TABLE wh_regions (
  key   text PRIMARY KEY,
  label text NOT NULL,
  sort  integer DEFAULT 0
);
```

| key              | label                | sort |
| ---------------- | -------------------- | ---- |
| `west_europe`    | 西ヨーロッパ         | 10   |
| `east_europe`    | 東欧・ロシア         | 20   |
| `islam`          | イスラーム           | 30   |
| `china`          | 中国                 | 40   |
| `mongol`         | モンゴル・中央アジア | 50   |
| `india`          | インド・南アジア     | 60   |
| `southeast_asia` | 東南アジア           | 70   |
| `korea_japan`    | 朝鮮・日本           | 80   |
| `orient`         | 古代オリエント       | 90   |
| `africa`         | アフリカ             | 100  |
| `americas`       | 南北アメリカ         | 110  |
| `prehistory`     | 先史・人類           | 120  |
| `other`          | その他               | 130  |

---

### `wh_dates`（本体）

```sql
CREATE TABLE wh_dates (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year        integer,                          -- 負数でBC統一。不明なら NULL
  year_end    integer,                          -- 期間終了年・没年（nullable）
  date_type   text NOT NULL DEFAULT 'year'
                CHECK (date_type = ANY (ARRAY['year', 'full', 'circa'])),
  full_date   date,
  event       text NOT NULL,
  description text,
  region      text[] DEFAULT '{}',
  field       text
                CHECK (field = ANY (
                  ARRAY['政治', '経済', '文化・宗教', '社会', '外交・戦争'])),
  record_type text NOT NULL DEFAULT 'event'
                CHECK (record_type = ANY (ARRAY['event', 'period', 'person'])),
  wiki_url    text,
  memo        text,
  wiki_score  smallint CHECK (wiki_score BETWEEN 1 AND 5),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

#### カラム詳細

| カラム        | 型              | 説明                                                                   |
| ------------- | --------------- | ---------------------------------------------------------------------- |
| `year`        | integer \| NULL | **負数でBC統一**。前3000年 → `-3000`、1789年 → `1789`。不明なら `NULL` |
| `year_end`    | integer \| NULL | 期間の終了年（`period`）・没年（`person`）。`event` には使わない       |
| `date_type`   | text            | `year`（年のみ）/ `full`（月日あり）/ `circa`（「頃」）                |
| `full_date`   | date            | `date_type='full'` のときのみ使用                                      |
| `event`       | text            | **名詞形で短く**。例：「フランス革命」「ナポレオンの戴冠」             |
| `description` | text            | 補足説明。フラッシュカード裏面に表示                                   |
| `region`      | text[]          | **配列型**。複数地域対応。`wh_regions.key` を参照                      |
| `field`       | text            | 政治 / 経済 / 文化・宗教 / 社会 / 外交・戦争                           |
| `record_type` | text            | `event`（歴史的な点）/ `period`（期間・王朝）/ `person`（人物）        |
| `wiki_url`    | text            | 参照するWikipediaページのURL。管理画面から手動入力またはAPI自動取得    |
| `memo`        | text            | **Markdown形式**。関連リンク・補足資料など自由記述                     |
| `wiki_score`  | smallint        | 1〜5。月1 cronでWikipedia Pageviews APIから自動更新                    |
| `updated_at`  | timestamptz     | triggerで自動更新（手動設定不要）                                      |

#### `record_type` の使い分け

| record_type | 用途             | year                  | year_end              |
| ----------- | ---------------- | --------------------- | --------------------- |
| `event`     | 歴史上の1点      | 必須                  | 使わない              |
| `period`    | 期間・王朝・戦争 | 開始年                | 終了年                |
| `person`    | 人物             | 生年（不明なら NULL） | 没年（不明なら NULL） |

#### `event` vs `description` の使い分け

```
┌─────────────────────────────┐
│          1789                │  ← year
└─────────────────────────────┘
              ↓ めくる
┌─────────────────────────────┐
│       フランス革命            │  ← event（名詞形・短く）
│                             │
│ 三部会召集を契機に勃発。       │  ← description（補足）
│ 絶対王政の終焉。人権宣言採択。 │
└─────────────────────────────┘
```

---

## 4. インデックス・制約・RLS

```sql
-- region配列フィルタ用（GIN）
CREATE INDEX wh_dates_region_gin ON wh_dates USING GIN (region);

-- updated_at 自動更新 trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wh_dates_updated_at
BEFORE UPDATE ON wh_dates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE wh_dates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read wh_dates"   ON wh_dates   FOR SELECT USING (true);
CREATE POLICY "anon read wh_regions" ON wh_regions FOR SELECT USING (true);

CREATE POLICY "auth insert wh_dates" ON wh_dates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update wh_dates" ON wh_dates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete wh_dates" ON wh_dates FOR DELETE TO authenticated USING (true);
```

---

## 5. wiki_score 更新フロー（月1 cron）

```
GitHub Actions（月1）
  ↓
① wh_dates から全レコード取得
  ↓
② wiki_url が設定されているレコードは直接そのURLのPVを取得
   wiki_url が NULL のレコードは event 名で Wikipedia 検索してフォールバック
  ↓
③ 過去12ヶ月のPV合計を対数変換
  ↓
④ 全レコードのパーセンタイルで1〜5に正規化
  ↓
⑤ wh_dates.wiki_score を UPDATE
```

---

## 6. 既存テーブルとの関係

| テーブル               | 今後の扱い                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `world_history_quiz`   | **廃止予定**。データはゼロから `wh_dates` に入力し直す（データ品質不足のため移行しない） |
| `world_history_events` | **廃止予定**。同上                                                                       |
| `chinese_history`      | **廃止予定**。`region=['china']` で統合                                                  |

---

## 7. データ入力ルール

- `event` は**名詞形**で記述（「〜が起きた」はNG）
- `year` は**負数でBC**（`is_bc` フラグは使わない）
- `circa`（頃）の場合は `date_type='circa'`、`year` はおおよその値を入れる
- `region` は最低1つ入れる（空配列のままにしない）
- `description` は空でもよいが、東大頻出事項は必ず入れる
- `wiki_url` は管理画面のWiki検索ボタンで取得するか、手動入力
- `memo` はMarkdown形式

---

_スキーマ変更時は必ずこのドキュメントを更新すること。_
