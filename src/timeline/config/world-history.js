// NOTE: world_history_quiz → wh_dates 移行完了後に有効になる。
//       現状は wh_dates の世界史データが少数のためデータ移行待ち。

import { formatJapaneseYear, fetchWhDates } from "./common.js";

const timelineConfig = {
  title: "世界史年表",
  backLink: "/history/",
  backLabel: "歴史ホーム",
  accentColor: "#1a2b3c",
  accentColorRgb: "26, 43, 60",
  showWikiLink: true,

  // ── タイムライン表示設定 ──────────────────────────────────
  accentLineColor: "#1a2b3c",
  showPeriodLines: true,

  categories: [
    { id: "政治", label: "政治", fg: "#283593" },
    { id: "経済", label: "経済", fg: "#1b5e20" },
    { id: "文化・宗教", label: "文化・宗教", fg: "#e65100" },
    { id: "社会", label: "社会", fg: "#006064" },
    { id: "外交・戦争", label: "外交・戦争", fg: "#b71c1c" },
  ],

  async fetchData() {
    return fetchWhDates(
      "id, year, year_end, date_type, full_date, event, description, wiki_url, field, region, record_type",
      (query) => query.not("region", "cs", '{"china"}'),
    );
  },

  formatYear(row) {
    return formatJapaneseYear(row);
  },

  getEvent(row) {
    return row.event;
  },
  getDescription(row) {
    return row.description;
  },
  getCategory(row) {
    return row.field || "その他";
  },
};

export default timelineConfig;
