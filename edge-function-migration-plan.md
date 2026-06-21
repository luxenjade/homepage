# Edge Functions 移行計画: docs ポスト読み込み

## 概要

`docs/` セクションの記事読み込み（一覧・詳細・保護記事）を、**Netlify Functions（Node.js Serverless）** から **Netlify Edge Functions（Deno）** に移行する。

## 移行の理由

- ユーザーの要件（エッジ実行）
- エッジで実行されるためレイテンシ低減
- Denoベースの軽量実行（コールドスタート短縮）
- 既存の `sw.js` Edge Function と統一されたアーキテクチャ

## 現状

### 現在のNetlify Functions（移行対象）

| ファイル | パス | 役割 |
|---------|------|------|
| `netlify/functions/posts.js` | `/api/posts` | 公開記事一覧取得 |
| `netlify/functions/post.js` | `/api/post?slug=xxx` | 単一公開記事取得 |
| `netlify/functions/protected-posts.js` | `/api/protected-posts` | 保護記事一覧取得 |
| `netlify/functions/protected-post.js` | `/api/protected-post?slug=xxx&password=xxx` | 保護記事取得+パスワード認証 |
| `netlify/functions/_lib/config.js` | — | カスタムSupabaseクライアント（PostgREST fetchベース） |
| `netlify/functions/_lib/cors.js` | — | CORSヘッダー |

### 既存のEdge Functions（維持）

| ファイル | パス | 役割 |
|---------|------|------|
| `netlify/edge-functions/sw.js` | `/api/sw` | アクセスログ（Supabaseに直接書き込み） |

### フロントエンド（変更なし）

- `src/docs/js/index-logic.js` → `/api/posts`, `/api/protected-posts` をfetch
- `src/docs/js/post-logic.js` → `/api/post`, `/api/protected-post` をfetch
- APIパスを維持するため、フロントエンドの変更は不要

## 移行計画

### Phase 1: 新しいEdge Functionsの実装

#### 1.1 共有ライブラリの作成

**新規**: `netlify/edge-functions/_lib/supabase.ts`

- 既存の `_lib/config.js` のカスタムPostgRESTラッパーをESM（TypeScript）に移植
- `fetch` はDenoではグローバルに使用可能なので、実装ロジックはほぼそのまま
- 環境変数は `Netlify.env.get()` で取得
- テーブル名定数を保持

#### 1.2 各Edge Functionの実装

**新規**: `netlify/edge-functions/posts.ts` → `/api/posts`

- 公開記事一覧を取得
- `posts_public` テーブルから `slug,title,date,description,category,tags,thumbnail` を選択
- `date` 降順でソート
- レスポンス: `{ posts: [...] }`

**新規**: `netlify/edge-functions/post.ts` → `/api/post`

- 単一公開記事を取得
- クエリパラメータ `slug` のバリデーション（`VALID_SLUG` パターン）
- `posts_public` テーブルから `*` を選択
- PGRST116（Not Found）を適切にハンドリング
- レスポンス: 記事オブジェクトそのまま

**新規**: `netlify/edge-functions/protected-posts.ts` → `/api/protected-posts`

- 保護記事一覧を取得
- `posts_private` テーブルから `slug,title,date,excerpt,category,tags` を選択
- `date` 降順でソート
- レスポンス: 記事配列

**新規**: `netlify/edge-functions/protected-post.ts` → `/api/protected-post`

- 保護記事取得+パスワード認証
- クエリパラメータ `slug`, `password` のバリデーション
- `posts_private` テーブルからリソースエンベディングで `posts_password` を結合
- サーバーサイドでパスワード照合
- パスワードフィールドをレスポンスから削除して返却
- 誤り時は401を返却

### Phase 2: 設定の更新

#### 2.1 `netlify.toml` の更新

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
```

旧Netlify Functionsのエントリーは削除（または上書き）。

### Phase 3: 旧Netlify Functionsの削除

以下を削除：

- `netlify/functions/posts.js`
- `netlify/functions/post.js`
- `netlify/functions/protected-posts.js`
- `netlify/functions/protected-post.js`
- `netlify/functions/_lib/config.js`
- `netlify/functions/_lib/cors.js`
- `netlify/functions/_lib/frontmatter.js`（使用されていないため）
- `netlify/functions/package.json`
- `netlify/functions/` ディレクトリが空になれば削除

### Phase 4: テスト・検証

#### 4.1 ローカルテスト

```bash
netlify dev
```

以下を確認：
- `GET /api/posts` → 公開記事一覧がJSONで返却
- `GET /api/post?slug=xxx` → 単一記事がJSONで返却
- `GET /api/protected-posts` → 保護記事一覧がJSONで返却
- `GET /api/protected-post?slug=xxx&password=yyy` → 認証成功時に記事返却、失敗時に401
- `OPTIONS` リクエスト → 204 + CORSヘッダー
- 無効なslug → 400
- 存在しないslug → 404（公開記事）または 401（保護記事）

#### 4.2 デプロイ検証

Netlifyにデプロイ後、フロントエンドから以下を確認：
- `src/docs/index.html` の記事一覧が正しく表示される
- 記事カードが日付降順に並んでいる
- カテゴリフィルター・検索が機能する
- 記事詳細ページ（`/docs/:slug`）が正しく読み込まれる
- 保護記事のパスワード認証が機能する
- パスワード自動保存（sessionStorage）が機能する

## 技術的詳細

### Edge Functionsでの環境変数アクセス

```typescript
const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || Netlify.env.get("SUPABASE_ANON_KEY") || "";
```

**注意**: `Netlify.env.get()` は Edge Functions 専用。Node.js Functions では `process.env` を使用。

### CORSヘッダー

```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};
```

### PostgRESTラッパーの移植ポイント

| 項目 | Node.js Functions | Edge Functions (Deno) |
|------|------------------|----------------------|
| モジュール | CommonJS (`require`) | ESM (`import`/`export`) |
| 環境変数 | `process.env` | `Netlify.env.get()` |
| fetch | Node.js 18+ global | Deno global |
| JSON | `JSON.parse`/`JSON.stringify` | 同じ |
| URL | `new URL` | 同じ |
| URLSearchParams | `new URLSearchParams` | 同じ |
| レスポンス | `{ statusCode, headers, body }` | `new Response(body, { status, headers })` |
| エントリーポイント | `exports.handler` | `export default (request, context) => Response` |
| パス設定 | `netlify.toml` またはフォルダ構造 | `export const config = { path: "/api/xxx" }` |

### パスワード認証の維持

`protected-post.ts` は以下を維持：
- サーバーサイドでのパスワード照合（クライアントに平文パスワードを返さない）
- 誤り時に `posts_password` テーブルの存在を隠す（401で統一）
- 成功時にパスワードフィールドを削除してから返却

### リスクと懸念事項

| リスク | 対応策 |
|-------|-------|
| Edge Functions で `@supabase/supabase-js` が使えない | 既存のカスタムPostgRESTラッパー（fetchベース）を維持 |
| 環境変数が読めない | `Netlify.env.get()` を使用。Netlifyダッシュボードで設定確認 |
| CORS エラー | ヘッダーを適切に設定。`OPTIONS` をハンドリング |
| パスワード認証のセキュリティ低下 | サーバーサイド照合を維持。クライアントにパスワードを返さない |
| フロントエンドとの互換性 | APIパスを維持。レスポンス形状を変更しない |

## 実装後のファイル構成

```
netlify/
├── edge-functions/
│   ├── supabase.ts          ← 新規（共有ライブラリ）
│   ├── posts.ts             ← 新規（/api/posts）
│   ├── post.ts              ← 新規（/api/post）
│   ├── protected-posts.ts   ← 新規（/api/protected-posts）
│   ├── protected-post.ts    ← 新規（/api/protected-post）
│   └── sw.ts                ← 既存（維持）
└── functions/               ← 削除（または空にする）
```

## タイムライン

| フェーズ | 作業 | 見積時間 |
|---------|------|---------|
| Phase 1 | 共有ライブラリ + 4 Edge Functions 実装 | 30分 |
| Phase 2 | `netlify.toml` 更新 | 5分 |
| Phase 3 | 旧Functions削除 | 5分 |
| Phase 4 | ローカルテスト + デプロイ検証 | 20分 |
| **合計** | | **約1時間** |

## 次のアクション

1. 本計画書をレビュー
2. `netlify/edge-functions/_lib/supabase.ts` から実装開始
3. `netlify.toml` を更新
4. 旧 `netlify/functions/` を削除
5. `netlify dev` でローカルテスト
6. デプロイして本番検証
