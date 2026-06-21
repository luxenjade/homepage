# Docs Backend Setup (Supabase)

このドキュメントでは、`docs/` セクションの記事を Supabase で管理するための設定手順を説明します。

## 1. Supabase テーブルの作成

Supabase の SQL Editor で `docs_supabase_schema.sql` の内容を実行してください。以下の 3 つのテーブルが作成されます。

- `posts_public`: 公開記事（Markdown、メタデータ、コンポーネント設定）
- `posts_private`: 保護記事（Markdown、メタデータ、コンポーネント設定）
- `posts_password`: 保護記事のパスワード（`slug` で `posts_private` と紐付け）

## 2. 環境変数の設定 (Netlify)

Netlify の管理画面で以下の環境変数を設定してください。

- `SUPABASE_URL`: Supabase プロジェクトの URL
- `SUPABASE_PB_KEY`: Supabase の Publishable Key (旧 Anon Key)
- `SUPABASE_SECRET_KEY`: Supabase の Secret Key (旧 Service Role Key / サーバーサイド用。保護記事取得に必須)

※ 現在の `netlify/lib/supabase.ts` では `SUPABASE_SECRET_KEY` が優先されます。

## 3. RLS (Row Level Security) の設定

Supabase 側で RLS を有効にする場合、以下のポリシーを設定してください。
（API キーのみで制限する場合は、ポリシーなしで RLS を無効にするか、全許可のポリシーを設定します）

### `posts_public`
- `SELECT`: `true` (全ユーザーに許可)
- `INSERT/UPDATE/DELETE`: 管理者のみ

### `posts_private` / `posts_password`
- `SELECT`: `true` (Netlify Edge Function 経由で取得するため。クライアントから直接参照されないよう Secret Key を推奨)

## 4. データの構造

### `tags` (TEXT[])
タグの配列です。
例: `{"JavaScript", "Tips"}`

### `date` (TEXT)
`YYYY-MM-DD` 形式で入力してください。
例: `2026-06-18`
