# Edge Functions 移行計画: docs ポスト読み込み

## 概要

`docs/` セクションの記事読み込み（一覧・詳細・保護記事）を、**Netlify Functions（Node.js Serverless）** から **Netlify Edge Functions（Deno）** に移行する。

現在のリポジトリには、Edge Function 実装が既に存在しています。残る作業は旧 `netlify/functions/` のクリーンアップと動作確認です。

## 移行の理由

- エッジ実行の要件に対応
- レイテンシ低減とコールドスタート短縮
- 既存の `sw.js` Edge Function とアーキテクチャを統一
- 同一 API パスを維持し、フロントエンド変更を最小化

## 現状

### 実装済みのEdge Functions

| ファイル                                    | パス                                        | 役割                                   |
| ------------------------------------------- | ------------------------------------------- | -------------------------------------- |
| `netlify/edge-functions/posts.ts`           | `/api/posts`                                | 公開記事一覧取得                       |
| `netlify/edge-functions/post.ts`            | `/api/post?slug=xxx`                        | 単一公開記事取得                       |
| `netlify/edge-functions/protected-posts.ts` | `/api/protected-posts`                      | 保護記事一覧取得                       |
| `netlify/edge-functions/protected-post.ts`  | `/api/protected-post?slug=xxx&password=xxx` | 保護記事取得+パスワード認証            |
| `netlify/edge-functions/sw.js`              | `/api/sw`                                   | アクセスログ（Supabaseに直接書き込み） |
| `netlify/edge-functions/admin-posts.ts`     | `/api/admin/posts`                          | 管理画面向け全記事取得                 |
| `netlify/edge-functions/admin-post.ts`      | `/api/admin/post`                           | 管理画面向け作成・更新・削除           |

### 共有ライブラリ

| ファイル                  | 役割                                          |
| ------------------------- | --------------------------------------------- |
| `netlify/lib/supabase.ts` | PostgREST ラッパー、CORS、認証、CRUD ヘルパー |

`netlify/lib/supabase.ts` は `netlify/edge-functions/` の外側に置かれ、Edge Function としてバンドルされないように設計されています。

### 旧 Netlify Functions も残存

| ファイル                                | 役割                           |
| --------------------------------------- | ------------------------------ |
| `netlify/functions/posts.js`            | 旧 `/api/posts` 実装           |
| `netlify/functions/post.js`             | 旧 `/api/post` 実装            |
| `netlify/functions/protected-posts.js`  | 旧 `/api/protected-posts` 実装 |
| `netlify/functions/protected-post.js`   | 旧 `/api/protected-post` 実装  |
| `netlify/functions/_lib/config.js`      | 旧 Supabase 設定               |
| `netlify/functions/_lib/cors.js`        | 旧 CORS ヘッダー               |
| `netlify/functions/_lib/frontmatter.js` | 未使用                         |
| `netlify/functions/package.json`        | CommonJS 指定                  |

### フロントエンド（変更不要）

- `src/docs/js/logic.js` → `/api/posts`, `/api/protected-posts` を fetch
- `src/docs/js/post-logic.js` → `/api/post`, `/api/protected-post` を fetch
- API パスとレスポンス形状は現状維持

### `netlify.toml` の状態

`netlify.toml` には、既に下記の Edge Functions 定義が含まれています。

```toml
[[edge_functions]]
  path = "/api/posts"
  function = "posts"

[[edge_functions]]
  path = "/api/post"
  function = "post"

[[edge_functions]]
  path = "/api/protected-posts"
  function = "protected-posts"

[[edge_functions]]
  path = "/api/protected-post"
  function = "protected-post"

[[edge_functions]]
  path = "/api/sw"
  function = "sw"

[[edge_functions]]
  path = "/api/admin/posts"
  function = "admin-posts"

[[edge_functions]]
  path = "/api/admin/post"
  function = "admin-post"
```

## 移行・クリーンアップ計画

### Phase 1: 現状確認

- 既存 Edge Functions の実装内容を確認
- `netlify/lib/supabase.ts` が共有ライブラリとして正しく配置されていることを確認
- 旧 `netlify/functions/` が不要になったことを確定

### Phase 2: テスト・検証

#### 2.1 ローカルテスト

```bash
netlify dev
```

確認項目：

- `GET /api/posts` → 公開記事一覧がJSONで返却
- `GET /api/post?slug=xxx` → 単一記事がJSONで返却
- `GET /api/protected-posts` → 保護記事一覧がJSONで返却
- `GET /api/protected-post?slug=xxx&password=yyy` → 認証成功時に記事返却、失敗時に401
- `OPTIONS` リクエスト → 204 + CORSヘッダー
- 無効な slug → 400
- 存在しない slug → 404（公開記事）または 401（保護記事）
- `POST /api/admin/post` / `PUT /api/admin/post` / `DELETE /api/admin/post` が認証付きで動作すること

#### 2.2 デプロイ検証

Netlify にデプロイ後、以下を確認：

- `src/docs/index.html` の記事一覧が正しく表示される
- 記事カードが日付降順に並んでいる
- カテゴリフィルター・検索が機能する
- 記事詳細ページが正しく読み込まれる
- 保護記事のパスワード認証が機能する
- `admin` API が動作する場合は管理画面の動作確認

## 技術的詳細

### 環境変数アクセス

`netlify/lib/supabase.ts` は `Netlify.env.get()` を使って環境変数を読み取ります。

```typescript
const SUPABASE_URL = "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SECRET_KEY");
```

### CORS と OPTIONS

`netlify/lib/supabase.ts` は共通の CORS ヘッダーと `OPTIONS` ハンドリングを提供します。

```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};
```

### 既存の実装差分

- `netlify/edge-functions/posts.ts` では `posts_public` から記事一覧を取得
- `netlify/edge-functions/post.ts` では `slug` のバリデーションを実施し、`PGRST116` を `404` にマッピング
- `netlify/edge-functions/protected-posts.ts` では `posts_private` からメタデータ一覧を取得
- `netlify/edge-functions/protected-post.ts` では `posts_private` と `posts_password` の埋め込みを使用し、サーバーサイドでパスワードを照合

### パスワード認証の維持

`protected-post.ts` は以下を維持します：

- サーバーサイドでのパスワード照合
- 誤り時に `posts_password` の存在を隠す（401 で統一）
- 成功時にパスワード情報をレスポンスから削除

### リスクと対応

| リスク                                               | 対応策                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `@supabase/supabase-js` を Edge Functions で使わない | 既存の fetch ベース PostgREST ラッパーを使う               |
| 環境変数が未設定                                     | `Netlify.env.get()` を使用し、Netlify ダッシュボードを確認 |
| CORS エラー                                          | 共有 `CORS_HEADERS` と `OPTIONS` ハンドラーで対応          |
| 旧 Node.js Functions の重複                          | 旧 `netlify/functions/` を削除して冗長性を解消             |

## 実装後のファイル構成

```
netlify/
├── lib/
│   └── supabase.ts          ← 共有ライブラリ。edge-functions 外部に配置
├── edge-functions/
│   ├── posts.ts             ← `/api/posts`
│   ├── post.ts              ← `/api/post`
│   ├── protected-posts.ts   ← `/api/protected-posts`
│   ├── protected-post.ts    ← `/api/protected-post`
│   ├── sw.ts                ← `/api/sw`
│   ├── admin-posts.ts       ← `/api/admin/posts`
│   └── admin-post.ts        ← `/api/admin/post`
└── functions/               ← 旧実装。削除対象
```

## タイムライン

| フェーズ | 作業                           | 見積時間    |
| -------- | ------------------------------ | ----------- |
| Phase 1  | 現状確認と実装差分レビュー     | 15分        |
| Phase 2  | 旧 `netlify/functions/` の削除 | 10分        |
| Phase 3  | ローカルテスト                 | 15分        |
| Phase 4  | デプロイ検証                   | 20分        |
| **合計** |                                | **約1時間** |

## 次のアクション

1. 本計画書をレビュー
2. `netlify/functions/` の旧実装をバックアップまたは削除
3. `netlify dev` で Edge Functions を確認
4. `netlify/functions/` を削除後、影響範囲を再確認
5. Netlify にデプロイして本番検証を行う
