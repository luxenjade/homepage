# luxenjade-website プロジェクトの非効率な点

プロジェクト全体を精査した結果、コードの保守性・ビルド効率・運用面・セキュリティの観点で見つかった非効率な点を以下にまとめます。優先度別に分類しています。

---

## 🔴 優先度：高（修正すると効果が大きい）

### 1. 旧 Netlify Functions の残置（移行未完了）

**ファイル**: `netlify/edge-functions/` の外側に置かれている旧実装

`README.md` の `Known legacy / issues` にも記載されている通り、旧 `netlify/functions/` が Edge Function と並行して残っており、デプロイされていませんが以下の問題があります：

- **コード重複**: CORS / Supabase 呼び出し / バリデーションが Edge 版と Functions 版に二重実装されている
- **混乱の元**: `netlify/functions/package.json` が CommonJS 設定を持つため、新規開発者が「どちらが正？」と迷う
- **CI/ビルドチェックのノイズ**: `check-js.mjs` が旧関数もチェック対象に含める

**対応**: `edge-function-migration-plan.md` の Phase 2（旧 `netlify/functions/` 削除）を即時実行すべき。

---

### 2. ビルドパイプラインの重複コピー・削除サイクル

**ファイル**: `scripts/build-steps/10-clean-copy.js`, `20-sub-projects.js`, `30-generate-pages.js`

`src/learning-box/` を一旦丸ごと `dist/` にコピーしてから即座に削除し、`learning-box/build.mjs` で再生成する流れになっており、ディスク I/O とビルド時間が無駄です。

```javascript
// 10-clean-copy.js
await cleanAndCopy("src", "dist"); // src/learning-box も含めて全部コピー
await rm("dist/learning-box", { recursive: true, force: true }); // 即削除

// 20-sub-projects.js
await rm("dist/learning-box", { recursive: true, force: true }); // 二度目の削除
await buildLearningBox(); // 再生成
```

**対応案**:

1. `cleanAndCopy` に `exclude` オプションを追加して learning-box を除外
2. または、ステップの順序を `20-sub-projects → 10-clean-copy(src → dist, exclude=learning-box)` にして無駄なコピーを排除

---

### 3. Service Worker のキャッシュバージョン手動管理

**ファイル**: `src/service-worker.js` L10

```javascript
const CACHE_VERSION = "v6";
```

`v6` がハードコードされており、ビルド時に自動的にインクリメントされません。新しいアセットをデプロイするたびに手動で文字列を変更する必要があり、ヒューマンエラーの元です。

**対応案**:

- `package.json` の `version` から自動生成する
- `Date.now()` のハッシュを使う
- Git のコミットハッシュを使う

---

### 4. Supabase Anon Key がフロントエンドに直書き

**ファイル**: `src/js/supabase_config.js` L11, `netlify/edge-functions/sw.js` L13

```javascript
const SUPABASE_KEY = "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";
```

sb_publishable キーとはいえ、フロントエンドに直接埋め込まれている状態です。問題点：

- キーが漏洩すると、リポジトリを fork された場合に Supabase 側でローテーションが必要
- アクセスログ（`/api/sw`）は publishable キーで認証しているが、本来 service role を使うべき処理がクライアントから直接 `access_logs` に書ける状態になっている

**対応案**:

- Edge Function 側で Service Role Key を使う（環境変数 `SUPABASE_SECRET_KEY` は既に存在）
- クライアントからは Edge Function 経由のみ呼ぶ

---

### 5. アクセスログ Edge Function の冗長な処理

**ファイル**: `netlify/edge-functions/sw.js`

- 同じ Supabase URL/Key が `netlify/lib/supabase.ts` と `sw.js` で重複定義されている
- 共有ライブラリの PostgREST ヘルパー（`insert()` など）を使うべき
- `sb_publishable` キーを使っているが、これは Edge Function サーバ側なので service role で書く方が適切

---

## 🟡 優先度：中（中長期的に改善したい）

### 6. `src/js/nav.js` の責務過多（モノリシックスクリプト）

**ファイル**: `src/js/nav.js`

1 つのファイルに以下が全部入っている：

- ナビゲーションバー DOM 生成
- フッター DOM 生成
- ハンバーガートグル制御
- アクティブリンク判定
- Collapse（Bootstrap 互換）実装
- Service Worker 登録
- 旧 Service Worker の解除

**問題**:

- 単体テスト不可能
- ナビゲーションを少し変えるだけで全部再バンドル
- ファイル末尾で `unregisterLegacyServiceWorkers` が `async function` で定義されているのに登録側の `.then()` 内で呼んでいるが、定義は `function unregisterLegacyServiceWorkers` で巻き上げできない書き方になっている（async 関数定義は変数宣言扱い）

**対応案**:

- `nav-core.js`, `nav-toggle.js`, `sw-register.js` などに分割
- 各責務でユニットテスト可能に

---

### 7. `snippet.js` のハードコード値がビルド時にも適用されない

**ファイル**: `snippet.js`, `scripts/lib/build-common.js`

`injectAccessLogSnippetIntoFiles` は HTML の `<body>` 直前にスニペットを差し込むが、`API_ENDPOINT = "/api/sw"` がソースに直書きされている。`dist` 用に API ベースパスを変えたい場合にビルド置換が必要だが、現在は仕組みがない。

**対応案**:

- ビルド時に `process.env.API_BASE` などで置換
- または HTML に `data-api-endpoint` 属性を置く

---

### 8. Zod スキーマと内部リンクの型不整合

**ファイル**: `scripts/schemas.js` vs `scripts/check-links.mjs`

- `LinkItemSchema` の `icon` は `optional` だが `pending.txt` の例では `icon: "/images/chinese-history.svg"` のようにパスが指定されている
- `check-links.mjs` の `existsAsGeneratedInnerLinkPath` は `quiz/components/quiz-bundle.css` という特定パスを特別扱いしており、生成物が増えると判定ロジックが肥大化する

**対応案**:

- ビルド成果物の構造を `manifest.json` 化して、チェック側で参照
- 特定パスのハードコードを除去

---

### 9. クイズ設定 JS の手書き文字列パース

**ファイル**: `scripts/build-steps/30-generate-pages.js` L131-145

```javascript
function extractQuizConfig(content) {
  const getString = (key) => {
    const regex = new RegExp(`${key}\\s*:\\s*["'\`](.*?)["'\`]`, "");
    return content.match(regex)?.[1] || "";
  };
  ...
}
```

正規表現で JS ファイルから設定値（`title`, `subtitle`, `backLink`）を抜き出しているため：

- 設定値に `:` や特殊文字を含むと破綻
- 設定値の型（オブジェクト・配列）が扱えない
- ツリーシェイクの対象にならない

**対応案**:

- 設定 JS を ES Module として import する（`export const config = { title: "...", ... }`）
- もしくはビルド前に Vite/Node で実 AST パース

---

### 10. ビルド時の HTML 全体書き換えが三重になっている

`index.html` の `<head>` への PWA スニペット注入は3経路：

1. `index.html` 自体に既に書いてある（`src/index.html` L31-37）
2. `injectBuildSnippetsIntoDir("dist")` がビルド時に再注入
3. `html-minifier-terser` が minify する

結果として PWA 関連の `<link>` が必ず2回現れるのを `if (output.includes(tag)) continue;` で防いでいるが、これは「PWA タグの有無で分岐する」ロジックであり、生成的負債。

**対応案**:

- `src/` 側はプレースホルダだけ置き、ビルド時に必ず注入する設計に統一

---

### 11. `archives/` が肥大化

**ファイル**: `archives/lbox-samples/`, `archives/pdf/`, `archives/timeline/`

- `archives/lbox-samples/` に現役の `learning-box` とほぼ同じ機能を持つサンプルの `app.js`, `data.js` がある
- `archives/timeline/` に現役の `src/timeline/` と重複する実装
- `archives/pdf/` も `src/docs/` 経由で動的に配信すべきか再評価

**対応**:

- 参照用であることが README に明記されていないため、新規開発者が誤って使うリスク
- 削除または `README.md` で参照専用と明記

---

### 12. `_redirects` の手書き部分が残っている

**ファイル**: `src/_redirects`

```bash
# Docs Clean URLs (Unified)
/docs/protected/:slug    /docs/post.html    200
/docs/:slug              /docs/post.html    200
/docs/                   /docs/index.html   200
```

README には「カテゴリリダイレクトはビルドで生成」とあるが、Docs 関連のリダイレクトは手書き。`scripts/config.js` の `SITEMAP_CATEGORIES` のような一元管理テーブルに統合すべき。

---

### 13. `inner_links/pending.txt` が構造的に壊れている

**ファイル**: `inner_links/pending.txt`

`grep_search` 結果から判断するに、カンマで区切られた JSON 断片のように見えるが、構文エラーになっている箇所がある（`{ ... }` が複数並んでおり、JSON 配列ではない）。`scripts/validate-data.mjs` は `.txt` を対象外としているためバリデーションされない。

**対応**:

- `.json` ファイルに昇格させてバリデーション対象に
- もしくは `pending/` ディレクトリ + `.md` チケット化

---

### 14. Vitest のカバレッジ測定がない

**ファイル**: `vitest.config.js`, `package.json`

- `pnpm test` でユニットテストは走るが、`coverage` フラグや閾値の設定がない
- テストが `scripts/utils.js` と `scripts/lib/build-common.js` の2ファイルだけ
- テンプレート置換ロジック (`30-generate-pages.js`) や Zod スキーマなどはテストされていない

**対応**:

- `vitest.config.js` に `coverage` セクションを追加
- 最低でも `30-generate-pages.js` の `renderSubIndex` / `renderQuizHtml` をテスト

---

## 🟢 優先度：低（リファクタリングついでに）

### 15. `netlify/lib/supabase.ts` の `then()` メソッド実装がトリッキー

**ファイル**: `netlify/lib/supabase.ts` L56

```typescript
then(resolve: any, reject: any) {
  return this.execute().then(resolve, reject);
}
```

`PostgrestQuery` を `thenable` にして `await` 可能にしているが、`async/await` の一般構文からは外れる。

**対応**:

- `execute()` を直接呼ぶ薄いラッパ関数 `query()` を export
- または Supabase 公式の `supabase-js` を Deno から使えるか確認

---

### 16. Edge Function の `console.error` が本番でも出力

**ファイル**: 全 `netlify/edge-functions/*.ts`

ログレベルが `error` 固定。アクセスパターンが分析できない。

**対応**:

- `request.method`, `path`, `status` を構造化ログとして出す
- Netlify の Blobs / Edge Function Logs に流す

---

### 17. PWA スニペットの注入ロジックが O(N×M)

**ファイル**: `scripts/lib/build-common.js` L33-49

```javascript
let output = html;
for (const tag of PWA_HEAD_SNIPPET_TAGS) {
  if (output.includes(tag)) continue;
  output = output.replace(/<\/head>/i, `    ${tag}\n</head>`);
}
```

`PWA_HEAD_SNIPPET_TAGS.length` 回の `replace` を HTML 全体に対して実行する。HTML ファイル数 × タグ数のループ。実害は小さいが、`includes` で全文走査するため大きい HTML に対して O(N) を毎タグ回している。

**対応**:

- 1回の正規表現マッチで全タグを一括挿入

---

### 18. `src/js/icons.js` の存在確認

`list_dir` 結果に `src/js/icons.js` があるが、PWA の Service Worker から参照されているのみで、テンプレート側からは参照されていない可能性がある。要確認。

---

### 19. `marked` の利用箇所が分散

**ファイル**: `src/docs/js/post-logic.js`, `scripts/build-steps/30-generate-pages.js`

- クライアント側で `marked` を CDN から読み込んでいる（実装場所不明）
- ビルド側で `marked` を使っているかは要確認
- セキュリティ（XSS 対策）のために `DOMPurify` も検討すべき

---

### 20. `src/docs/js/post-common.js` の `resolveImageSrc` が API 未実装

```javascript
return `/api/image?path=${encodeURIComponent(clean)}`;
```

`/api/image` というエンドポイントが Edge Functions に見当たらない。404 を返しているはず。実装するか、URL 解決方法を再検討する必要あり。

---

## 📊 サマリ

| カテゴリ                        | 件数   |
| ------------------------------- | ------ |
| 🔴 優先度：高（運用・本番影響） | 5      |
| 🟡 優先度：中（保守性・拡張性） | 9      |
| 🟢 優先度：低（リファクタ品質） | 6      |
| **合計**                        | **20** |

---

## 🛠️ 推奨アクション順序

1. **最優先**: 旧 `netlify/functions/` 削除（`edge-function-migration-plan.md` Phase 2 完遂）
2. **次点**: Supabase Key の Edge 経由化（`/api/sw` の service role 移行）
3. **並行可**: ビルドパイプラインのコピー削除最適化（ステップ 10/20 整理）
4. **並行可**: Service Worker キャッシュバージョンのビルド時自動生成
5. **以降**: `nav.js` 分割、Zod 統合、テストカバレッジ拡充

---
