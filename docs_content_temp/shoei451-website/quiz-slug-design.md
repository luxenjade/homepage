# quiz.html?slug= 統合設計書

作成日: 2026-03-30
対象リポジトリ: `Shoei451/shoei451-website`

---

## 設計思想

### なぜこの設計か

従来のクイズページは「HTMLシェル + ロジックJS」が1セットで各フォルダに存在していた。

```
history/world/year-to-event/index.html   ← シェル
history/world/year-to-event/quiz.js      ← ロジック
history/world/event-to-year/index.html   ← ほぼ同じシェル
history/world/event-to-year/quiz.js      ← ほぼ同じロジック
history/china/index.html
history/china/quiz.js
seikei/timeline/quiz.html
seikei/timeline/quiz.js
others/idiom-quiz/index.html
others/idiom-quiz/quiz.js
```

シェルHTMLは5ファイルが存在するが内容の95%が同じ。ロジックJSも構造は共通で、データソースと表示形式だけが違う。

この設計の問題点：

- 新しいクイズを追加するたびに2ファイル（HTML + JS）を作る必要がある
- シェルのUI変更（例：ヘッダー追加）が5ファイルに波及する
- `check-links.mjs` 等のツールが全ファイルを把握しにくい

### 解決アプローチ：config駆動の動的ロード

`timeline.html?slug=` と同じパターン。1つの `quiz.html` が slug を受け取り、対応する `quiz-config.js` を動的にロードして動作する。

```
quiz.html?slug=history/world/year-to-event
quiz.html?slug=history/world/event-to-year
quiz.html?slug=history/china/era-quiz
quiz.html?slug=seikei/timeline/quiz
quiz.html?slug=others/idiom-quiz
```

各フォルダには `quiz-config.js` だけを置く。HTMLシェルもロジックJSも不要。

---

## ファイル構成（移行後）

```
quiz.html                        ← 統合シェル（1ファイル）
quiz-components/
├── quiz-shell.css
├── start/
│   ├── start-screen.js
│   └── start-screen.css
├── progress/
│   ├── progress.js
│   └── progress.css
├── question/
│   ├── question-area.js
│   └── question-area.css
├── answer/
│   ├── choice-buttons.js        ← answerType='choice' 時のみロード
│   ├── text-input.js            ← answerType='text' 時のみロード
│   └── answer.css
├── feedback/
│   ├── feedback.js
│   └── feedback.css
├── result/
│   ├── result.js
│   └── result.css
└── quiz-logic.js                ← 全クイズ共通ロジック（新規作成）

history/world/year-to-event/
└── quiz-config.js               ← 設定のみ（HTMLもquiz.jsも不要）
history/world/event-to-year/
└── quiz-config.js
history/china/
└── era-quiz-config.js           ← era-quiz にリネームする予定
seikei/timeline/
└── quiz-config.js
others/idiom-quiz/
└── quiz-config.js
```

---

## `quiz.html` の動作フロー

```
1. URL から slug を取得
       ↓
2. {slug}/quiz-config.js を動的ロード
       ↓
3. window.QUIZ_CONFIG を読む
       ↓
4. QUIZ_CONFIG.answerType に応じて answer コンポーネントを追加ロード
       choice → choice-buttons.js
       text   → text-input.js
       ↓
5. quiz-logic.js を起動（QUIZ_CONFIG を渡す）
       ↓
6. quiz-logic.js が start-screen を描画、以降はユーザー操作で進行
```

ポイント：**quiz-logic.js は QUIZ_CONFIG の内容を知らない。** config が渡す関数（`fetchData`、`formatQuestion` 等）を呼ぶだけ。これにより quiz-logic.js はどのクイズにも対応できる汎用エンジンになる。

---

## 自動選択の仕組み

`quiz-config.js` に `answerType` を定義して、`quiz.html` のローダーがそれを読んでから必要なスクリプトだけ動的に `<script>` タグで追加する。

```js
// quiz.html のローダー部分（概念）
async function initQuiz(cfg) {
  const scripts = [
    "quiz-components/start/start-screen.js",
    "quiz-components/progress/progress.js",
    "quiz-components/question/question-area.js",
    "quiz-components/feedback/feedback.js",
    "quiz-components/result/result.js",
  ];

  // answerType によって追加
  if (cfg.answerType === "choice") {
    scripts.push("quiz-components/answer/choice-buttons.js");
  } else if (cfg.answerType === "text") {
    scripts.push("quiz-components/answer/text-input.js");
  }

  // 逐次ロード後に quiz-logic.js を起動
  await loadScripts(scripts);
  initQuizLogic(cfg);
}
```

これはシンプルで確実に動く。

---

## 実装する価値があるかの判断

**価値がある理由：**

現在クイズのHTMLシェルが5個あって中身がほぼ同じ。`timeline.html` と同じパターンで `quiz.html?slug=` に統合すれば、シェルが1ファイルになる。新しいクイズを追加する時に `quiz-config.js` を1ファイル書くだけで済む。

**ただし前提条件が1つある：**

`quiz-logic.js`（全クイズ共通のロジック）が本当に「configだけ差し替えれば動く」汎用性を持てるかどうか。現在の各 `quiz.js` を見ると、世界史・中国史・政経・イディオムでロジックはほぼ同じだが、細部に違いがある。

具体的には：

| クイズ              | 固有ロジック                                           |
| ------------------- | ------------------------------------------------------ |
| 世界史year-to-event | `buildDistractors()` で同 period から選択肢を生成      |
| イディオム          | 回答後に詳細カード表示、Supabase統計更新、報告フォーム |
| 政経・中国史        | ほぼ汎用パターンで吸収可能                             |

イディオムの「回答後の詳細カード」は `showFeedback()` の `extraRenderer` で既に対応できている。Supabase統計更新と報告フォームは config に `onAnswer` フックを渡せば吸収できる。`buildDistractors()` も config に `buildDistractors` 関数を持たせれば汎用化できる。

つまり **全部 config に移譲できる**。ただしイディオムの報告フォームのような複雑なUIを config に書くのはかなりごつくなる。

---

## 推奨する粒度

「全部統合する」より「80%を統合して20%は config で拡張する」設計の方が現実的。

```js
window.QUIZ_CONFIG = {
  // 基本設定
  title: '世界史年代クイズ',
  answerType: 'choice',  // 'choice' | 'text'

  // データ取得
  fetchData: async () => { ... },

  // 範囲選択
  rangeMode: 'single',
  ranges: [...],

  // 出題数
  countMode: 'select',
  countOptions: [10, 20, 30, 'all'],

  // 問題生成（汎用ロジックで足りない場合のみ定義）
  buildDistractors: null,  // null なら汎用ランダム選択

  // フック（null なら何もしない）
  onAnswer: null,          // ({ q, isCorrect }) => void  統計更新など
  extraRenderer: null,     // (el, q, isCorrect) => void  詳細カードなど

  // 表示
  formatQuestion: (row) => ({ text: row.event, category: row.period }),
  formatCorrectLabel: (row) => row.event,
}
```

これなら単純なクイズは config 数十行で完結し、イディオムのような複雑なケースは `onAnswer` と `extraRenderer` で拡張できる。

---

## 結論

実装する価値はある。`timeline.html?slug=` が動いた今、同じパターンでクイズも統合するのは自然な流れで、サイトリデザインと並行してスコープに入れる意味がある。

ただし今すぐ実装するより、**サイトリデザインの設計を先に固める**方がいい。ナビバー・共通CSS変数・フォルダ構造が決まってから `quiz.html` を作った方が、後で移動しなくて済む。

---

## `QUIZ_CONFIG` の型定義

```js
window.QUIZ_CONFIG = {

  // ── メタ情報 ──────────────────────────────────────────────
  title: string,          // クイズタイトル（ヘッダー・タブタイトルに使用）
  subtitle: string,       // サブタイトル（省略可）
  backLink: string,       // 戻るリンク先
  backLabel: string,      // 戻るリンクのラベル（省略可、デフォルト: 'ホーム'）
  accentColor: string,    // CSS変数 --color-accent に適用（省略可）

  // ── 回答タイプ ────────────────────────────────────────────
  // quiz.html がこの値を見て追加ロードするコンポーネントを決める
  answerType: 'choice' | 'text',

  // ── スタート画面（start-screen.js に渡す） ─────────────────
  rangeMode: 'single' | 'multi' | 'none',
  rangeLabel: string,                      // 省略可
  ranges: [{ id: string, label: string }], // rangeMode='none' なら不要
  countMode: 'slider' | 'select',
  countMin: number,        // slider 時
  countMax: number,        // slider 時
  countDefault: number,
  countOptions: (number | 'all')[],  // select 時
  startLabel: string,      // 省略可、デフォルト: 'クイズを開始'

  // ── データ取得 ────────────────────────────────────────────
  // quiz-logic.js が onStart 時に呼ぶ
  // selectedRanges: string[], count: number|'all' を受け取り
  // 問題データの配列を返す Promise
  fetchData: async (selectedRanges, count) => QuestionRow[],

  // ── 問題フォーマット ──────────────────────────────────────
  // QuestionRow → showQuestion() に渡す引数を返す
  formatQuestion: (row) => ({
    text: string,
    sub: string | null,
    category: string | null,
    imageUrl: string | null,   // 省略可
  }),

  // ── 正解ラベル（フィードバック表示用） ────────────────────
  // 不正解時に「正解：〇〇」として表示する文字列を返す
  formatCorrectLabel: (row) => string,

  // ── 選択肢生成（answerType='choice' 時） ──────────────────
  // null の場合は quiz-logic.js が汎用ランダム選択でdistractorを生成する
  // カスタムロジックが必要な場合（例：同period内から選ぶ）に定義する
  buildDistractors: null | ((currentRow, allData) => QuestionRow[]),

  // ── 正誤判定（answerType='text' 時） ──────────────────────
  // null の場合は quiz-logic.js が parseInt で数値比較する（年号入力用）
  // テキスト一致判定など別のロジックが必要な場合に定義する
  validate: null | ((rawInput, row) => { ok: boolean, value: any, isCorrect: boolean, message?: string }),

  // ── フック（省略可、null なら何もしない） ─────────────────

  // 回答確定後に呼ばれる（統計更新・追加表示などに使用）
  // showFeedback() の前に実行される
  onAnswer: null | (({ row, isCorrect, selected }) => void),

  // フィードバックエリアへの追加レンダリング
  // feedback.js の extraRenderer に相当
  // null の場合は標準の正解/不正解表示のみ
  extraRenderer: null | ((el, row, isCorrect, selected) => void),

  // 復習リストの1件分のHTMLを返す（省略可）
  // null の場合は result.js のデフォルトレンダラーを使う
  renderMistake: null | ((mistakeItem) => string),

};
```

---

## `quiz-logic.js` の責務

quiz-logic.js は以下のみを担当する。**クイズ固有の知識を一切持たない。**

1. `initStartScreen(startConfig)` を呼んでスタート画面を描画
2. スタートボタン押下後に `QUIZ_CONFIG.fetchData()` を呼ぶ
3. 取得データをシャッフルして `quizSet` を構築
4. `QUIZ_CONFIG.formatQuestion()` で問題文を生成して `showQuestion()` に渡す
5. `answerType='choice'` の場合：
   - `QUIZ_CONFIG.buildDistractors` が null なら汎用ランダム抽出
   - `showChoices()` に渡す
6. `answerType='text'` の場合：
   - `QUIZ_CONFIG.validate` が null なら整数比較
   - `showTextInput()` に渡す
7. 回答後：
   - `QUIZ_CONFIG.onAnswer` を呼ぶ（null なら skip）
   - `showFeedback()` を呼ぶ（`QUIZ_CONFIG.extraRenderer` を渡す）
8. 全問終了後に `showResult()` を呼ぶ（`QUIZ_CONFIG.renderMistake` を渡す）
9. 「間違えた問題だけ」復習モードの制御

---

## 各クイズの `quiz-config.js` 実装例

### 世界史 年号→出来事（4択）

```js
// history/world/year-to-event/quiz-config.js
window.QUIZ_CONFIG = {
  title: "世界史年代クイズ",
  subtitle: "年号 → 出来事",
  backLink: "../../../sub-index.html?slug=history/world",
  backLabel: "World History",
  answerType: "choice",

  rangeMode: "single",
  rangeLabel: "時代区分",
  ranges: [
    { id: "~0", label: "紀元前" },
    { id: "1~1000", label: "1〜1000年" },
    // ...
  ],
  countMode: "select",
  countDefault: 10,
  countOptions: [10, 20, 30, "all"],

  async fetchData(selectedRanges, count) {
    const period = selectedRanges[0];
    const { data, error } = await window._db
      .from("world_history_quiz") // wh_dates 移行後は変更
      .select("*")
      .eq("period", period);
    if (error) throw new Error(error.message);
    const shuffled = shuffleArray(data);
    return count === "all" ? shuffled : shuffled.slice(0, count);
  },

  formatQuestion: (row) => ({
    text: formatYear(row.is_bc ? -Math.abs(row.year) : row.year),
    category: row.period,
  }),

  formatCorrectLabel: (row) => row.event,

  // 同じ period 内から distractor を生成するカスタムロジック
  buildDistractors: (current, allData) =>
    shuffleArray(
      allData.filter(
        (r) => r.period === current.period && r.event !== current.event,
      ),
    ).slice(0, 3),

  onAnswer: null,
  extraRenderer: null,
  renderMistake: null,
};
```

### 政経 出来事→年号（テキスト入力）

```js
// seikei/timeline/quiz-config.js
window.QUIZ_CONFIG = {
  title: "政治・経済 年代クイズ",
  subtitle: "出来事 → 年号",
  backLink: "../../sub-index.html?slug=seikei",
  backLabel: "政経ホーム",
  answerType: "text",

  rangeMode: "multi",
  rangeLabel: "出題カテゴリ",
  ranges: [
    { id: "国際政治", label: "国際政治" },
    // ...
  ],
  countMode: "slider",
  countMin: 5,
  countMax: 50,
  countDefault: 10,

  async fetchData(selectedCategories, count) {
    const { data, error } = await window._db
      .from("seikei_events")
      .select("*")
      .in("category", selectedCategories);
    if (error) throw new Error(error.message);
    const shuffled = shuffleArray(data);
    return count === "all" ? shuffled : shuffled.slice(0, parseInt(count));
  },

  formatQuestion: (row) => ({
    text: row.title,
    category: row.category,
    sub: row.description || null,
  }),

  formatCorrectLabel: (row) => `${row.year}年`,

  // text入力のカスタムバリデーション
  // null にすると quiz-logic.js が parseInt で比較する汎用処理を使う
  validate: (raw, row) => {
    if (!/^\d{4}$/.test(raw)) {
      return { ok: false, message: "4桁の年を入力してください" };
    }
    return {
      ok: true,
      value: parseInt(raw),
      isCorrect: parseInt(raw) === row.year,
    };
  },

  onAnswer: null,
  extraRenderer: null,
  renderMistake: null,
};
```

### イディオム（4択 + 詳細カード + 統計更新）

```js
// others/idiom-quiz/quiz-config.js
window.QUIZ_CONFIG = {
  title: "Vintage イディオムクイズ",
  answerType: "choice",
  // ...

  // 統計更新（Supabase への書き込み）
  onAnswer: async ({ row, isCorrect }) => {
    // 非同期だがクイズ進行をブロックしない
    updateIdiomStats(row.id, isCorrect);
  },

  // 回答後の詳細カード表示
  extraRenderer: (el, row, isCorrect) => {
    el.innerHTML = buildIdiomFeedbackCard(row, isCorrect);
  },

  renderMistake: (item) => {
    const q = item._raw;
    return `...イディオム固有の復習HTML...`;
  },
};
```

---

## `quiz-logic.js` が汎用処理する部分

### distractor 生成のデフォルト（buildDistractors が null の場合）

```js
function defaultBuildDistractors(current, allData, correctKey) {
  // correctKey: 正解を識別するフィールド名（例: 'event', 'idiom_extracted'）
  return shuffleArray(
    allData.filter((r) => r[correctKey] !== current[correctKey]),
  ).slice(0, 3);
}
```

config に `correctKey` を定義するか、`formatCorrectLabel` の戻り値で比較するか、実装時に決める。

### テキスト入力のデフォルト validate（validate が null の場合）

```js
function defaultValidate(raw, row, cfg) {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return { ok: false, message: "数字を入力してください" };
  const correct = cfg.getCorrectYear(row); // config に getCorrectYear を持たせる
  return { ok: true, value: n, isCorrect: n === correct };
}
```

---

## `quiz.html` の動的ロード実装

```js
// quiz.html 内の script
const slug = new URLSearchParams(location.search).get("slug");

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

async function boot() {
  // 1. config をロード
  await loadScript(slug + "/quiz-config.js");
  const cfg = window.QUIZ_CONFIG;
  if (!cfg) throw new Error("QUIZ_CONFIG が定義されていません");

  // 2. 共通コンポーネントをロード（常に必要）
  const common = [
    "quiz-components/start/start-screen.js",
    "quiz-components/progress/progress.js",
    "quiz-components/question/question-area.js",
    "quiz-components/feedback/feedback.js",
    "quiz-components/result/result.js",
  ];

  // 3. answerType に応じて追加ロード
  const answerScript =
    cfg.answerType === "choice"
      ? "quiz-components/answer/choice-buttons.js"
      : "quiz-components/answer/text-input.js";

  // 4. 逐次ロード（依存順序を保証）
  for (const src of [...common, answerScript]) {
    await loadScript(src);
  }

  // 5. ロジック起動
  await loadScript("quiz-components/quiz-logic.js");
  window.initQuizLogic(cfg);
}

boot().catch((err) => {
  document.getElementById("state-msg").textContent =
    "読み込みエラー: " + err.message;
});
```

---

## timeline との設計上の差異

|                   | `timeline.html?slug=`                       | `quiz.html?slug=`                                                                |
| ----------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| config ファイル名 | `timeline-config.js`                        | `quiz-config.js`                                                                 |
| 動的ロード対象    | config のみ                                 | config + answerコンポーネント + quiz-logic                                       |
| ロジックの場所    | `timeline.html` 内に完結                    | 外部 `quiz-logic.js` に分離                                                      |
| 理由              | timeline のロジックは単純（fetch + render） | クイズのロジックは複雑（状態管理・画面遷移・復習モード）なので外部ファイルが適切 |

---

## 移行手順

既存ページを壊さずに段階的に移行する。

1. `quiz.html` と `quiz-logic.js` を実装・動作確認（中国史 era-quiz で先行テスト）
2. 各クイズの `quiz-config.js` を作成
3. 既存の `index.html` + `quiz.js` を `quiz-config.js` に置き換え
4. 旧ファイルは `_archive/` に移動してから一定期間後に削除

既存ページへのリンクは `quiz.html?slug=...` に更新する（`sub-index.html` の `list.json` 側で変更）。

---

## 未決定事項

- `correctKey`（distractor 生成時の正解識別フィールド）の渡し方：config プロパティ vs `formatCorrectLabel` の戻り値で比較
- `quiz-logic.js` の `getCorrectYear`（text入力デフォルト）の設計
- `quiz.html` の配置場所（ルート直下 or `quiz/index.html`）— サイト構造リデザインと合わせて決定
- 各 config ファイルの命名規則（`quiz-config.js` 固定 or スラッグ末尾から推定）
- `wh_utils.js` の `shuffleArray`・`formatYear` を `quiz-logic.js` から参照するか、`quiz.html` で CDN 前に読み込むか

---

## アイデア

### その他アイデア

- [ ] wh-utils.jsという命名が紛らわしいので、クイズコンポーネントに統合する
