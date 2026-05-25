// quiz/config/seikei.js
// 政治・経済 年代クイズ【出来事 → 年号】

window.QUIZ_CONFIG = {
  title: "政治・経済 年代クイズ",
  subtitle: "出来事 → 年号",
  backLink: "/seikei/",
  backLabel: "政治・経済",
  answerType: "text",
  supabaseTable: "seikei",

  rangeMode: "multi",
  rangeLabel: "出題カテゴリ",
  ranges: [
    { id: "国際政治", label: "国際政治" },
    { id: "国際経済", label: "国際経済" },
    { id: "国内政治", label: "国内政治" },
    { id: "日銀金融政策", label: "日銀金融政策" },
    { id: "農業", label: "農業" },
    { id: "消費者生活・公害対策", label: "消費者・公害" },
    { id: "労働問題", label: "労働問題" },
    { id: "社会保障", label: "社会保障" },
  ],
  countMode: "slider",
  countMin: 5,
  countMax: 50,
  countDefault: 10,

  inputLabel: "この出来事は何年？",
  inputPlaceholder: "例: 1945",
  inputHint: "西暦4桁で入力してください",
  inputMaxLength: 4,

  async fetchData(selectedCategories, count) {
    const { data, error } = await window._db
      .from(window.SUPABASE_TABLES.SEIKEI)
      .select("*")
      .in("category", selectedCategories);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const shuffled = window._quizShuffle(data);
    const total = parseInt(count);
    return isNaN(total) ? shuffled : shuffled.slice(0, total);
  },

  formatQuestion(row) {
    return {
      text: row.title,
      category: row.category,
      sub: row.description || null,
    };
  },

  formatCorrectLabel(row) {
    return `${_extractYear(row)}年`;
  },

  getCorrectValue(row) {
    return _extractYear(row);
  },

  validate(raw, row) {
    if (!/^\d{4}$/.test(raw.trim())) {
      return { ok: false, message: "4桁の年を半角数字で入力してください" };
    }
    const value = parseInt(raw, 10);
    return { ok: true, value, isCorrect: value === _extractYear(row) };
  },

  renderMistake(item) {
    const chip = item.category
      ? `<span class="qz-category-chip" style="font-size:0.7rem;">${_esc(item.category)}</span>`
      : "";
    const desc = item._raw?.description
      ? `<p style="color:var(--qz-text-sub);font-size:0.88rem;margin-top:6px;">${_esc(item._raw.description)}</p>`
      : "";
    return `
      <div class="qz-review-item__header">
        ${chip}
        <p class="qz-review-item__question">${_esc(item.questionText)}</p>
      </div>
      ${desc}
      <div class="qz-review-item__answers">
        <span class="qz-review-item__user">あなた：${_esc(item.userAnswer)}</span>
        <span class="qz-review-item__correct">正解：<strong>${_esc(item.correctAnswer)}</strong></span>
      </div>
    `;
  },

  buildDistractors: null,
  onAnswer: null,
  extraRenderer: null,
  renderChoice: null,
};

function _extractYear(row) {
  return parseInt(String(row.date ?? row.year ?? "0").substring(0, 4), 10);
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
