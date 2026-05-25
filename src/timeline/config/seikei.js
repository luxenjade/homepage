import { fetchRows } from "./common.js";

const timelineConfig = {
  title: "Politics & Economics Timeline",
  backLink: "/seikei/",
  backLabel: "政経ホーム",
  accentColor: "#1a2b3c",
  accentColorRgb: "26, 43, 60",
  showWikiLink: false,

  // ── タイムライン表示設定 ──────────────────────────────────
  accentLineColor: "#1a2b3c",
  showPeriodLines: false, // seikei はラインなし・ドットのみ

  categories: [
    { id: "国際政治", label: "国際政治", fg: "#1e40af" },
    { id: "国際経済", label: "国際経済", fg: "#854d0e" },
    { id: "国内政治", label: "国内政治", fg: "#1e3a8a" },
    { id: "日銀金融政策", label: "日銀金融政策", fg: "#065f46" },
    { id: "農業", label: "農業", fg: "#166534" },
    {
      id: "消費者生活・公害対策",
      label: "消費者・公害",
      fg: "#0c4a6e",
    },
    { id: "労働問題", label: "労働問題", fg: "#9d174d" },
    { id: "社会保障", label: "社会保障", fg: "#9a3412" },
  ],

  async fetchData() {
    return fetchRows(
      window.SUPABASE_TABLES.SEIKEI,
      "id, year, year_end, date_type, full_date, title, description, category, record_type",
    );
  },

  formatYear(row) {
    if (row.date_type === "full" && row.full_date) {
      const d = new Date(row.full_date);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    }
    const y = row.year;
    if (y == null) return "不明";
    return `${y}年`;
  },

  getEvent(row) {
    return row.title;
  },
  getDescription(row) {
    return row.description;
  },
  getCategory(row) {
    return row.category;
  },
};

export default timelineConfig;
