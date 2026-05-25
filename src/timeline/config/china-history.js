// ============================================================
// history/china/modules/chinaTimeline.js
//
// 既存の /timeline/?slug=china-history 向け config。
// src/timeline/config/china-history.js を置き換える。
//
// 変更点（旧 china-history.js との差分）:
//   - fetchData() を chinaData.js 経由に切り替え
//     （直接 fetchWhDates を呼ぶのをやめる）
//   - chinaPeriods.js を使い、field が null のレコードに
//     時代ラベルをフォールバック補完する
//   - getCategory() のフォールバックを "その他" → 時代ラベルに変更
//
// 使い方:
//   timeline/index.html の slug=china-history でそのまま動く。
//   既存の timeline/script.js は変更不要。
//
// ============================================================

import { getChinaAll } from "../../history/china/modules/chinaData.js";
import {
  loadPeriods,
  getPeriodLabel,
} from "../../history/china/modules/chinaPeriods.js";

// ── 時代ラベルの初期化 ────────────────────────────────────────
// timeline/script.js の initTimeline() から fetchData() が呼ばれる前に
// chinaPeriods のロードが完了していれば getPeriodLabel() が使える。
// fetchData() 内で loadPeriods() を呼ぶことで順序を保証する。

const timelineConfig = {
  title: "中国王朝史年表",
  backLink: "/history/",
  backLabel: "歴史ホーム",
  accentColor: "#d73c37",
  accentColorRgb: "215, 60, 55",
  showWikiLink: true,

  accentLineColor: "#d73c37",
  showPeriodLines: true,

  // status-0410.md の確定版時代区分をカテゴリとして使う。
  // field カラムが null のレコードには getPeriodLabel() で補完する。
  categories: [
    { id: "封建制の時代", label: "封建制の時代", fg: "#92400e" },
    { id: "帝国の形成", label: "帝国の形成", fg: "#991b1b" },
    { id: "魏晋南北朝", label: "魏晋南北朝", fg: "#9d174d" },
    { id: "律令の時代", label: "律令の時代", fg: "#1e40af" },
    { id: "五代十国", label: "五代十国", fg: "#075985" },
    { id: "多極並立の時代", label: "多極並立の時代", fg: "#065f46" },
    { id: "元・明・清", label: "元・明・清", fg: "#4c1d95" },
    { id: "その他", label: "その他", fg: "#374151" },
  ],

  async fetchData() {
    // periods のロードと events の取得を並列で行う
    await loadPeriods();
    const { events, periods, persons } = await getChinaAll();

    // timeline/script.js は record_type で events と lines（period/person）を
    // 内部で分岐するため、全レコードを結合して返す
    return [...events, ...periods, ...persons];
  },

  formatYear(row) {
    if (row.date_type === "full" && row.full_date) {
      // full_date は "YYYY-MM-DD" 形式
      return row.full_date.slice(0, 4) + "年";
    }
    const y = row.year;
    if (y == null) return "不明";
    const base = y < 0 ? `前${Math.abs(y)}年` : `${y}年`;
    return row.date_type === "circa" ? base + "頃" : base;
  },

  getEvent(row) {
    return row.event;
  },

  getDescription(row) {
    return row.description;
  },

  // カテゴリ判定:
  //   field が設定されている → そのまま使う（"政治" など wh_dates の field 値）
  //   field が null → 年から時代ラベルを補完
  //   year も null → "その他"
  //
  // NOTE: wh_dates の field は "政治"|"経済"|"文化・宗教"|"社会"|"外交・戦争" の
  // いずれかだが、timeline の categories は時代区分ベース。
  // 現状 field はほぼ null なので時代ラベル補完がメインになる。
  // field が充足されてきたら categories を field ベースに切り替えること。
  getCategory(row) {
    if (row.year != null) {
      const label = getPeriodLabel(row.year);
      if (label !== "不明") return label;
    }
    return "その他";
  },
};

export default timelineConfig;
