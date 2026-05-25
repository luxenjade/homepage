// quiz/config/world-year-to-event.js
// 世界史年代クイズ【年号 → 出来事】

window.QUIZ_CONFIG = {
  title: "世界史年代クイズ",
  subtitle: "年号 → 出来事",
  backLink: "/history/",
  backLabel: "History",
  answerType: "choice",
  supabaseTable: "wh_quiz",
  image: "/images/wh-quiz.png",

  rangeMode: "single",
  rangeLabel: "時代区分",
  ranges: [
    { id: "~0", label: "紀元前" },
    { id: "1~1000", label: "1〜1000年" },
    { id: "1001~1500", label: "1001〜1500年" },
    { id: "1501~1700", label: "1501〜1700年" },
    { id: "1701~1800", label: "1701〜1800年" },
    { id: "1801~1900", label: "1801〜1900年" },
    { id: "1901~1945", label: "1901〜1945年" },
    { id: "1946~1989", label: "1946〜1989年" },
    { id: "1990~", label: "1990年〜" },
  ],
  countMode: "select",
  countDefault: 10,
  countOptions: [10, 20, 30, "all"],

  async fetchData(selectedRanges, count) {
    const period = selectedRanges[0];
    let all = [],
      start = 0;
    const BATCH = 1000;

    while (true) {
      const { data, error } = await window._db
        .from(window.SUPABASE_TABLES.WH_QUIZ)
        .select("*")
        .eq("period", period)
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
    const year = row.is_bc ? -Math.abs(row.year) : row.year;
    return {
      text: window._quizFormatYear(year),
      category: row.period,
    };
  },

  formatCorrectLabel(row) {
    return row.event;
  },

  buildDistractors: function (current, allData) {
    return window
      ._quizShuffle(
        allData.filter(
          (r) => r.period === current.period && r.event !== current.event,
        ),
      )
      .slice(0, 3);
  },

  onAnswer: null,
  extraRenderer: null,
  renderMistake: null,
  getCorrectValue: null,
  validate: null,
  renderChoice: null,
};
