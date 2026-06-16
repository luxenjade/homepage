// ============================================================
// js/theme-toggle-extended.js
// 役割:
//   1. テーマをページ描画前に即時適用（フラッシュ防止）
//   2. #theme-toggle-container が存在するページにボタンを注入
//
// 使い方:
//   HTML側は <span class="logo-switches" id="theme-toggle-container"></span>
//   だけ書けばよい。SVGは不要。
//   CSS側は .dark クラスでダークテーマを定義するだけ。
//
// 注意:    テーマの状態は localStorage の "pref-theme" に保存される。
//          直接 "dark" または "light" を入れる。値がない場合は OSの設定に従う。
// ============================================================

// ── 1. テーマ適用（可能な限り早く）──────────────────────────
(function () {
  const pref = localStorage.getItem("pref-theme");
  const shouldUseDark =
    pref === "dark" ||
    (!pref && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function applyTheme() {
    if (!document.body) return false;
    document.body.classList.toggle("dark", shouldUseDark);
    return true;
  }

  if (!applyTheme()) {
    document.addEventListener("DOMContentLoaded", applyTheme, { once: true });
  }
})();

// ── 2. ボタン注入 ────────────────────────────────────────────
const TOGGLE_MARKUP = `
  <button id="theme-toggle" aria-label="Toggle Theme">
    <svg id="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg id="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  </button>`;

function mountThemeToggle() {
  const container = document.getElementById("theme-toggle-container");
  if (!container) return;

  if (!container.querySelector("#theme-toggle")) {
    container.innerHTML = TOGGLE_MARKUP;
  }

  const toggle = container.querySelector("#theme-toggle");
  if (!toggle || toggle.dataset.boundThemeToggle === "1") return;

  toggle.dataset.boundThemeToggle = "1";
  toggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "pref-theme",
      document.body.classList.contains("dark") ? "dark" : "light",
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountThemeToggle);
} else {
  mountThemeToggle();
}
