// ============================================================
// docs/js/theme-toggle.js
// 役割:
//   共有のテーマ切り替え実装を読み込むためのラッパー。
//   実装本体は src/js/theme-toggle.js を共用する。
// ============================================================

(function () {
  if (window.__themeToggleBootstrapped) return;

  const script = document.createElement("script");
  script.src = "/js/theme-toggle.js";
  script.async = false;
  document.head.appendChild(script);
})();
