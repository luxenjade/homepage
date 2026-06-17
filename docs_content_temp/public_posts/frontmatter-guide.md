---
title: Frontmatterガイド
date: 2026-03-25
description: フロントマターの仕様について
thumbnail: https://picsum.photos/1200/500
category: developer
components.katex: false
components.highlight: true
published: true
---

# Frontmatter ガイド

451-docs の `md-contents/451-docs/public_posts/` に置く MD の frontmatter 仕様。

---

## 完全な例

```markdown
---
title: 微積分まとめ
date: 2026-03-10
description: 数列・極限・微分の基本をまとめたノート
thumbnail: https://picsum.photos/1200/500
category: math
components.katex: true
components.highlight: false
---

# 本文...
```

---

## components フィールド

| キー        | 型      | デフォルト | 説明                                         |
| ----------- | ------- | ---------- | -------------------------------------------- |
| `katex`     | boolean | `false`    | KaTeX（数式）を読み込むか                    |
| `highlight` | boolean | `false`    | Highlight.js（コードハイライト）を読み込むか |

`components:` ブロックを**省略した場合は両方 false**（何も読み込まない）。

### 使い分け

| 記事の種類                         | katex   | highlight |
| ---------------------------------- | ------- | --------- |
| 数学・物理のノート（数式あり）     | `true`  | `false`   |
| プログラミングのメモ（コードあり） | `false` | `true`    |
| 歴史・政治経済の一問一答           | `false` | `false`   |
| 競プロ解説（数式 + コード）        | `true`  | `true`    |

---

## 既存記事への対応

### seikei.md（政治経済）

```markdown
---
title: 政治・経済プリント
date: 2026-02-23
description: 政治・経済の3学期期末試験対策用の一問一答
thumbnail: https://picsum.photos/1200/500
category: miscellaneous
components.katex: false
components.highlight: false
---
```

### chinese-dinasities-table-1.md（中国史）

```markdown
---
title: 中国王朝史まとめ ver.1
date: 2026-02-23
description: 中国の王朝史。諸王朝の特徴を表にまとめました（殷～唐まで）
thumbnail: https://chinese-history-note.netlify.app/images/3dynasities_favicon.png
category: history
components.katex: false
components.highlight: false
---
```

### test.md（構文テスト）

```markdown
---
title: 構文テスト
date: 2026-02-23
description: 全構文の表示確認用サンプル。
thumbnail: https://picsum.photos/1200/500
category: miscellaneous
components.katex: true
components.highlight: true
---
```
