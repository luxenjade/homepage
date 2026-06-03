// quiz/config/jodoushi-typing.js
// 古典助動詞クイズ【一問一答モード】
// DATA は /quiz/config/jodoushi-data.js で定義。

window.QUIZ_CONFIG = {
  title: "古典 助動詞クイズ",
  subtitle: "一問一答モード",
  backLink: "/miscellaneous/",
  backLabel: "Miscellaneous",
  accentColor: "#c0392b",
  image: "/images/ougi.svg",
  answerType: "text",
  dataScript: "/quiz/config/jodoushi-data.js",
  // supabaseTable なし（静的データ）

  rangeMode: "multi",
  rangeLabel: "出題項目",
  ranges: [
    { id: "katsuyo", label: "活用形" },
    { id: "setsuzoku", label: "接続" },
    { id: "imi", label: "意味" },
  ],
  countMode: "slider",
  countMin: 5,
  countMax: 50,
  countDefault: 20,

  inputLabel: "答えを入力",
  inputPlaceholder: "例: む・め（1種類）",
  inputHint: "複数ある場合は1種類だけ答えてください",

  async fetchData(selectedRanges, count) {
    const KATSUYO_KEYS = [
      "mizen",
      "renyo",
      "shushi",
      "rentai",
      "izen",
      "meirei",
    ];
    const wantsKatsuyo = selectedRanges.includes("katsuyo");
    const wantsSetsuzoku = selectedRanges.includes("setsuzoku");
    const wantsImi = selectedRanges.includes("imi");

    const candidates = [];
    for (const row of window.JODOUSHI_DATA) {
      if (wantsSetsuzoku && !_isEmpty(row.setsuzoku)) {
        candidates.push({ row, col: "setsuzoku" });
      }
      if (wantsImi && !_isEmpty(row.imi)) {
        candidates.push({ row, col: "imi" });
      }
      if (wantsKatsuyo) {
        for (const col of KATSUYO_KEYS) {
          if (!_isEmpty(row[col])) {
            candidates.push({ row, col });
          }
        }
      }
    }

    const shuffled = window._quizShuffle(candidates);
    const total = parseInt(count);
    return isNaN(total) ? shuffled : shuffled.slice(0, total);
  },

  // row は { row: DataRow, col: string } のペア
  formatQuestion(item) {
    const colLabel = window.JODOUSHI_COL_LABELS[item.col] ?? item.col;
    const suffix =
      _asArray(item.row[item.col]).length >= 2 ? "（1種類答えよ）" : "";
    return {
      template: "助動詞 {{name}} の {{colLabel}} は？{{suffix}}",
      vars: {
        name: { value: _formatValue(item.row.name), strong: true },
        colLabel: { value: colLabel, strong: true },
        suffix,
      },
      category: colLabel,
      sub: _buildSub(item),
    };
  },

  formatCorrectLabel(item) {
    return _formatValue(item.row[item.col]);
  },

  getCorrectValue(item) {
    return item.row[item.col];
  },

  validate(raw, item) {
    const input = _norm(raw);
    if (!input) return { ok: false, message: "答えを入力してください" };
    const isCorrect = _asArray(item.row[item.col]).some(
      (ans) => _norm(ans) === input,
    );
    return { ok: true, value: raw, isCorrect };
  },

  renderMistake(mistake) {
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
    return !n || n === "-" || n === "－" || n === "|";
  });
}

function _norm(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function _buildSub(item) {
  const r = item.row;
  const col = item.col;
  if (col === "setsuzoku") return `活用の種類：${_formatValue(r.katsuyo)}`;
  if (col === "imi") return `接続：${_formatValue(r.setsuzoku)}`;
  // 活用形の場合は接続と活用種類を補足
  return `接続：${_formatValue(r.setsuzoku)} ／ 活用：${_formatValue(r.katsuyo)}`;
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
