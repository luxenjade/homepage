// quiz/config/china-era.js
// 中国王朝史 年代クイズ【出来事 → 年号】
// データソース: wh_dates (region @> '{"china"}', record_type = 'event')
// field が付与されたレコードからカテゴリフィルタが有効になる。
// 未付与 (field = null) のレコードは「すべて」選択時のみヒットする。

window.QUIZ_CONFIG = {
  title: "中国王朝史 年代クイズ",
  subtitle: "出来事 → 年号",
  backLink: "/history/",
  backLabel: "History",
  accentColor: "#df7c5e",
  answerType: "text",
  supabaseTable: "wh_dates",
  image: "/images/chinese-history.svg",

  rangeMode: "multi",
  rangeLabel: "出題カテゴリ",
  ranges: [
    { id: "all", label: "すべて" },
    { id: "王朝成立", label: "王朝成立" },
    { id: "王朝滅亡", label: "王朝滅亡" },
    { id: "反乱", label: "反乱" },
    { id: "戦争", label: "戦争" },
    { id: "外交", label: "外交" },
    { id: "内政", label: "内政" },
    { id: "経済", label: "経済" },
    { id: "文化", label: "文化" },
    { id: "その他", label: "その他" },
  ],
  countMode: "slider",
  countMin: 5,
  countMax: 50,
  countDefault: 10,

  inputLabel: "この出来事は何年？",
  inputPlaceholder: "例: -221 / 618",
  inputHint: "紀元前は負の数で入力（例：-221 = 前221年）",
  inputMaxLength: 6,

  async fetchData(selectedCategories, count) {
    const wantsAll = selectedCategories.includes("all");

    // ベースクエリ
    let q = window._db
      .from(window.SUPABASE_TABLES.WH_DATES)
      .select("id, year, event, field, description")
      .contains("region", ["china"])
      .eq("record_type", "event");

    // "all" が含まれていなければ field フィルタを適用
    if (!wantsAll) {
      q = q.in("field", selectedCategories);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    // field フィルタ適用後にヒット0件 → 全件フォールバック
    let rows = data ?? [];
    if (rows.length === 0 && !wantsAll) {
      const { data: all, error: e2 } = await window._db
        .from(window.SUPABASE_TABLES.WH_DATES)
        .select("id, year, event, field, description")
        .contains("region", ["china"])
        .eq("record_type", "event");
      if (e2) throw new Error(e2.message);
      rows = all ?? [];
    }

    const shuffled = window._quizShuffle(rows);
    const total = parseInt(count);
    return isNaN(total) ? shuffled : shuffled.slice(0, total);
  },

  formatQuestion(row) {
    return {
      text: row.event,
      category: row.field ?? null,
      sub: row.description ?? null,
    };
  },

  formatCorrectLabel(row) {
    return window._quizFormatYear(row.year);
  },

  getCorrectValue(row) {
    return row.year;
  },

  validate(raw, row) {
    if (!/^-?\d+$/.test(raw.trim())) {
      return {
        ok: false,
        message: "年を数字で入力してください（紀元前は負の数）",
      };
    }
    const value = parseInt(raw, 10);
    return { ok: true, value, isCorrect: value === row.year };
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
};

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
