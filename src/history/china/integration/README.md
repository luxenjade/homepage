# chinese-history-note

`shoei451-website` 内の `src/history/china/integration/` に同梱している、中国史学習用の独立ミニアプリ。

**[→ Live Demo](https://chinese-history-note.netlify.app)**

---

## 現在の状態

2026-04-03 時点で、このコピーは「計画段階」ではなく、主要画面が一通り動く実装済みスナップショットになっている。

- `index.html` - 王朝カード一覧と全文検索
- `map.html` - 王朝変遷図と検索付きサイドパネル
- `timeline.html` - 静的イベントデータを使う年表
- `dynasty.html` - `まとめ / 穴埋め / 年表 / 人物` の4タブ詳細ページ
- `culture-quiz.html` - 文化史クイズ

---

## データソース

このリポジトリ内の実装は、現在は Supabase 直結ではなくローカル静的データ中心で動いている。

| ファイル                 | 役割                   |
| ------------------------ | ---------------------- |
| `js/common/dynasties.js` | 王朝マスターデータ     |
| `js/common/events.js`    | 年表イベントの静的配列 |
| `js/common/quizdata.js`  | 文化人物データ         |
| `notes/*.md`             | 王朝ノート本文         |

`events.js` には BC を含む中国史イベントがまとまっており、`dynasty.html` と `timeline.html` はここを参照する。

---

## 実装済みの機能

### 王朝一覧

- 時代ごとの王朝カード表示
- `SearchEngine` による全文検索
- イベント・人物・制度を含む横断検索
- ノート存在チェックによるバッジ切り替え

### 王朝詳細

- `?slug=tang` 形式のルーティング
- 4タブ構成:
  - まとめ
  - 穴埋め
  - 年表
  - 人物
- Markdown 本文のレンダリング
- `⟦⟦...⟧⟧` 記法ベースの穴埋め表示
- 王朝期間で絞り込んだイベント表示
- `quizdata.js` を使った人物一覧

### 年表・変遷図・クイズ

- `timeline.html` はカテゴリフィルタと検索付き
- `map.html` はノード選択と検索結果サイドパネル付き
- `culture-quiz.html` は既存の文化史クイズ実装を維持

---

## ファイル構成

```text
src/history/china/integration/
├── index.html
├── map.html
├── timeline.html
├── dynasty.html
├── culture-quiz.html
├── css/
│   ├── common.css
│   ├── culture-quiz.css
│   ├── dynasty.css
│   ├── index.css
│   ├── map.css
│   └── timeline.css
├── js/
│   ├── card-render.js
│   ├── culture-quiz.js
│   ├── dynasty.js
│   ├── map.js
│   ├── timeline.js
│   └── common/
│       ├── dynasties.js
│       ├── events.js
│       ├── icons.js
│       ├── nav.js
│       ├── quizdata.js
│       └── search.js
├── md/
│   └── progress.md
└── notes/
    └── tang.md
```

---

## 現在の不足分

- ノートは `notes/tang.md` のみで、他王朝ぶんは未整備
- `map.html` には `images/3dynasties_favicon.png` への壊れた参照が残っている
- 旧計画メモ類は削除し、この `README.md` と `md/progress.md` を正規ドキュメントとする

---

## 補足

- UI と構成は [learning-box](https://github.com/Shoei451/learning-box) / [451-docs](https://451-docs.netlify.app) の影響を受けている
- 実装はフレームワークなしの HTML/CSS/Vanilla JS
- 詳細な現況は `md/progress.md` を参照
