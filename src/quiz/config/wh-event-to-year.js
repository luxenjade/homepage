// quiz/config/world-event-to-year.js
// 世界史年代クイズ【出来事 → 年号】

window.QUIZ_CONFIG = {
  title: "世界史年代クイズ",
  subtitle: "出来事 → 年号",
  backLink: "/history/",
  backLabel: "History",
  answerType: "text",
  supabaseTable: "wh_quiz",
  image: "/images/wh-quiz.png",

  rangeMode: "single",
  rangeLabel: "章",
  ranges: [
    { id: "第1章", label: "第1章 | 古代文明圏" },
    { id: "第2章", label: "第2章 | 中世ヨーロッパ" },
    { id: "第3章", label: "第3章 | 近現代ヨーロッパ" },
    { id: "第4章", label: "第4章 | 東アジア（中国・モンゴル）" },
    { id: "第5章", label: "第5章 | 東アジア（日本・朝鮮）" },
    { id: "第6章", label: "第6章 | イスラーム世界" },
    { id: "第7章", label: "第7章 | 南アジア・東南アジア" },
    { id: "第8章", label: "第8章 | アメリカ大陸" },
    { id: "第9章", label: "第9章 | 第一次世界大戦" },
    { id: "第10章", label: "第10章 | 第二次世界大戦" },
    { id: "第11章", label: "第11章 | 戦後国際史" },
  ],
  countMode: "select",
  countDefault: 10,
  countOptions: [10, 20, 30, "all"],

  inputLabel: "年号を入力",
  inputPlaceholder: "例: 1789",
  inputHint: "紀元前は負の数で入力（例：-221 = 前221年）",

  async fetchData(selectedRanges, count) {
    const chapter = selectedRanges[0];
    let all = [],
      start = 0;
    const BATCH = 1000;

    while (true) {
      const { data, error } = await window._db
        .from(window.SUPABASE_TABLES.WH_QUIZ)
        .select("*")
        .eq("chapter", chapter)
        .order("is_bc", { ascending: false })
        .order("year", { ascending: true })
        .range(start, start + BATCH - 1);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < BATCH) break;
      start += BATCH;
    }

    const shuffled = window._quizShuffle(all);
    if (count === "all") return shuffled;
    return shuffled.slice(0, parseInt(count));
  },

  formatQuestion(row) {
    return {
      text: row.event,
      category: row.chapter,
    };
  },

  formatCorrectLabel(row) {
    const year = row.is_bc ? -Math.abs(row.year) : row.year;
    return window._quizFormatYear(year);
  },

  getCorrectValue(row) {
    return row.is_bc ? -Math.abs(row.year) : row.year;
  },

  validate(raw, row) {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return { ok: false, message: "数字を入力してください" };
    const correct = row.is_bc ? -Math.abs(row.year) : row.year;
    return { ok: true, value: n, isCorrect: n === correct };
  },

  buildDistractors: null,
  onAnswer: null,
  extraRenderer: null,
  renderMistake: null,
  renderChoice: null,
};
