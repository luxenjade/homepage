# docs/ の移行プラン

- 概要：現在Github PATを使用してPrivate repoからmdファイルを取得し表示している。md（テキストとして）の保存先をsupabaseに切り替える。

- テーブル名は `public_posts`と`posts_password`と`private_posts`
- netlify/functions/_lib/config.jsには、URLの`site`パラメーターを変更することでページの見た目や表示内容が変わる仕掛けがあるが、これも廃止する。

## 詳細タスク

### 1. Supabase テーブル作成
- `public_posts`: slug, title, date, description, category, thumbnail, content
- `private_posts`: slug, title, date, excerpt, category, content
- `posts_password`: slug, password (ハッシュ化せずプレーンテキストで管理。GitHub-baseの時と同様)

### 2. Netlify Functions の修正
- `github.js` への依存を排除し、Supabase API (PostgREST) を使用するように変更。
- `_lib/config.js` の `SITES` 定数と `getSite` 関数を削除。単一のサイト設定のみを保持するように変更。
- 以下のエンドポイントを更新:
    - `posts.js`: `public_posts` テーブルからメタデータを全件取得。
    - `post.js`: `public_posts` テーブルから `slug` で 1 件取得。
    - `protected-posts.js`: `private_posts` テーブルからメタデータを全件取得。
    - `protected-post.js`: `private_posts` と `posts_password` を結合（または順次取得）して検証と取得を行う。

### 3. フロントエンドの修正
- `src/docs/js/index-logic.js` 等から `site` パラメーターの処理を削除。
- `src/_redirects` の `/docs/:site/` パターンを `/docs/` に変更。

### 4. データ移行
- `docs_content_temp/` にある既存の markdown ファイルを Supabase にインポート。
- frontmatter をパースして各カラムにマッピングする。

