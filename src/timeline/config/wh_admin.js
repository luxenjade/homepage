import { initWorldHistoryAdminApp } from "../../wh_admin/app.js";

const timelineConfig = {
  title: "世界史年表 管理",
  backLink: "/history/",
  backLabel: "歴史ホーム",
  accentColor: "#1a2b3c",
  showSearch: false,
  showStats: false,

  async renderApp(ctx) {
    await initWorldHistoryAdminApp(ctx);
  },
};

export default timelineConfig;
