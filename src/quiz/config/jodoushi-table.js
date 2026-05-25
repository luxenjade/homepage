// quiz/config/jodoushi-table.js
// 古典助動詞クイズ【表埋めモード】
// DATA は /quiz/config/jodoushi-data.js で定義。

window.QUIZ_CONFIG = {
  title: "古典 助動詞クイズ",
  subtitle: "表埋めモード",
  backLink: "/miscellaneous/",
  accentColor: "#c0392b",
  image: "/images/ougi.svg",
  backLabel: "Miscellaneous",
  answerType: "table",
  dataScript: "/quiz/config/jodoushi-data.js",
  // supabaseTable なし（静的データ）

  rangeMode: "none",
  countMode: "slider",
  countMin: 1,
  countMax: 29, // DATA.length
  countDefault: 5,

  // 表の行定義（全行）
  tableRows: [
    { key: "name", label: "助動詞" },
    { key: "setsuzoku", label: "接続" },
    { key: "katsuyo", label: "活用の種類" },
    { key: "imi", label: "意味" },
    { key: "mizen", label: "未然形" },
    { key: "renyo", label: "連用形" },
    { key: "shushi", label: "終止形" },
    { key: "rentai", label: "連体形" },
    { key: "izen", label: "已然形" },
    { key: "meirei", label: "命令形" },
  ],

  headerKey: "name",

  async fetchData(selectedRanges, count) {
    const shuffled = window._quizShuffle([...window.JODOUSHI_DATA]);
    const total = parseInt(count);
    return isNaN(total) ? shuffled : shuffled.slice(0, total);
  },

  formatQuestion(row) {
    return {
      text: _formatValue(row.name),
      category: null,
    };
  },

  // 空欄にするキー = 活用形のうち値が空でないもの
  getBlankKeys(row) {
    const BLANK_TARGETS = [
      "mizen",
      "renyo",
      "shushi",
      "rentai",
      "izen",
      "meirei",
    ];
    return BLANK_TARGETS.filter((key) => !_isEmpty(row[key]));
  },

  // 正誤判定（表示値と正規化して比較）
  isCorrect(key, inputValue, row) {
    const input = _norm(inputValue);
    return _asArray(row[key]).some((ans) => _norm(ans) === input);
  },

  // 非空欄セルの表示値
  formatCell(key, row) {
    return _formatValue(row[key]);
  },

  renderMistake(mistake) {
    if (mistake._isTable) {
      return `
        <div class="qz-review-item__header">
          <p class="qz-review-item__question">助動詞「${_esc(mistake.questionText)}」の活用表</p>
        </div>
        <div class="qz-review-item__answers">
          <span class="qz-review-item__user" style="color:var(--qz-incorrect);">一部不正解</span>
        </div>
      `;
    }
    return `
      <div class="qz-review-item__header">
        <p class="qz-review-item__question">${_esc(mistake.questionText)}</p>
      </div>
      <div class="qz-review-item__answers">
        <span class="qz-review-item__user">あなた：${_esc(mistake.userAnswer)}</span>
        <span class="qz-review-item__correct">正解：<strong>${_esc(mistake.correctAnswer)}</strong></span>
      </div>
    `;
  },

  buildDistractors: null,
  onAnswer: null,
  extraRenderer: null,
  renderChoice: null,
  formatCorrectLabel: null,
  getCorrectValue: null,
  validate: null,
};

// ── ヘルパー ──────────────────────────────────────────────

function _asArray(v) {
  return Array.isArray(v) ? v : [v];
}

function _formatValue(v) {
  return _asArray(v).join("・");
}

function _isEmpty(v) {
  return _asArray(v).every((s) => {
    const n = _norm(s);
    return !n || n === "-" || n === "－" || n === "—";
  });
}

function _norm(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
