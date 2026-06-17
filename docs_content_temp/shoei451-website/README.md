# shoei451-website Markdown Map

最終更新: 2026-04-03

このフォルダは `shoei451-website` 向けの外部 Markdown 保管場所。現行サイト全体を追うときは、まず `public_posts/site/` 配下の正規ドキュメントを参照する。

---

## 現行の正規ドキュメント

- `public_posts/site/site-overview.md`
  - サイト全体の概要、主要導線、現行アーキテクチャ
- `public_posts/site/content-map.md`
  - 各カテゴリと主要ページの一覧
- `public_posts/site/shared-systems.md`
  - 共通ランタイム、PWA、データ取得、Netlify まわりの整理
- `public_posts/site/maintenance-status.md`
  - 運用用チェック、既知の移行中領域、確認コマンド
- `public_posts/todo.md`
  - サイト全体の現況スナップショットと当面の課題
- `tree.md`
  - リポジトリ構造の最新スナップショット

---

## 専門メモとして残すもの

- `public_posts/attributions.md`
  - 素材出典一覧
- `public_posts/wh/wh_table_renewal.md`
  - `wh_dates` / `wh_regions` 設計メモ
- `public_posts/wh/wh_cron_plan.md`
  - 世界史データ配信の build / cache 方針メモ

これらはサイト全体の正規説明ではなく、個別設計メモとして扱う。

---

## 2026-04-03 に整理したもの

- `public_posts/site/` 配下を `src/` ベースの現行構成に更新
- `links/`・PWA・`dist` ビルド前提をサイト全体ドキュメントへ反映
- `public_posts/todo.md` を直近コミットと現在の check 結果に合わせて更新
- repo 内 `src/history/china/integration/` の古い計画メモを `README.md` と `md/progress.md` に集約したことを反映

---

## 運用ルール

- サイト全体の説明は `public_posts/site/` に寄せる
- 旧パスや削除済みディレクトリを前提にした記述を残さない
- 同じ役割の TODO / 概要 / 運用メモを複数ファイルに分散させない
- 進捗はリポジトリ実体、`git log`、`git status`、`npm run check` を優先して更新する
