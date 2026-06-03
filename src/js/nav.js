// ============================================================
// js/nav.js
//
// サイト共通ナビバーとフッターを inject する。
// theme-toggle.js より先に実行すること。
// Bootstrap CSS 非依存版。
//
// 使い方（各HTMLのbody先頭に配置）:
//   <div id="nav-container"></div>
//   ...コンテンツ...
//   <footer id="site-footer"></footer>
//
//   <!-- body閉じタグ直前 -->
//   <script src="/js/nav.js"></script>
//   <script src="/js/theme-toggle.js"></script>
//
// CSS依存:
//   base.css の #site-nav, .site-nav__* スタイルを使用。
//   .site-nav__menu の開閉は .show クラスの付け外しで制御
//   （base.css で @media (max-width: 767.98px) 内に定義済み）。
// ============================================================

(function () {
  // ── ハンバーガーアイコン SVG ──────────────────────────────
  const HAMBURGER_SVG = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <line x1="2" y1="4.5" x2="16" y2="4.5"/>
      <line x1="2" y1="9"   x2="16" y2="9"/>
      <line x1="2" y1="13.5" x2="16" y2="13.5"/>
    </svg>`;

  // ── ナビバー HTML ────────────────────────────────────────
  const NAV_HTML = `
    <nav id="site-nav" aria-label="サイトナビゲーション">
      <div class="site-nav__inner">

        <a class="site-nav__brand" href="/index.html">luxenjade</a>

        <button class="site-nav__toggle" type="button"
                aria-controls="site-nav-menu"
                aria-expanded="false"
                aria-label="メニューを開く">
          ${HAMBURGER_SVG}
        </button>

        <div class="site-nav__menu" id="site-nav-menu">
          <ul class="site-nav__links">
            <li><a class="site-nav__link" href="/history/">歴史</a></li>
            <li><a class="site-nav__link" href="/geography/">地理</a></li>
            <li><a class="site-nav__link" href="/seikei/">政治・経済</a></li>
            <li><a class="site-nav__link" href="/miscellaneous/">その他</a></li>
            <li><a class="site-nav__link" href="/links/">リンク集</a></li>
          </ul>

          <div class="site-nav__actions">
            <a class="site-nav__link" href="/about/"
               style="font-size:0.85rem;">About</a>
            <div id="theme-toggle-container" class="logo-switches"></div>
          </div>
        </div>

      </div>
    </nav>
  `;

  // ── フッター HTML ─────────────────────────────────────────
  const FOOTER_HTML = `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <span style="font-size:0.85rem;">
          © 2026 Shoei Okamoto &nbsp;·&nbsp;
          <a href="/privacy-policy.html">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="/about/">About</a> &nbsp;·&nbsp;
          <a href="/sitemap.html">Site Map</a> &nbsp;·&nbsp;
          <a href="https://451-docs.netlify.app/?site=luxenjade-website"
             target="_blank" rel="noopener">Docs</a>
        </span>
        <a href="mailto:okamotoshoei4512@gmail.com"
           style="font-size:0.85rem; color:var(--color-text-secondary);">
          okamotoshoei4512@gmail.com
        </a>
      </div>
    </footer>
  `;

  // ── ナビバー inject ───────────────────────────────────────
  const navContainer = document.getElementById("nav-container");
  if (navContainer) {
    navContainer.innerHTML = NAV_HTML;
    _setActiveLink();
    _initToggle();
  }

  // ── フッター inject ───────────────────────────────────────
  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    footerEl.innerHTML = FOOTER_HTML;
  }

  // ── Collapse（汎用版）────────────────────────────────────
  // data-bs-toggle="collapse" との後方互換も維持
  _initCollapse();

  // ── アクティブリンクの自動検出 ────────────────────────────
  function _setActiveLink() {
    const path = location.pathname + location.search;

    document.querySelectorAll(".site-nav__link").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "/index.html") return;

      if (href.includes("?slug=")) {
        if (path.includes(href)) link.classList.add("active");
        return;
      }

      if (path.startsWith(href)) link.classList.add("active");
    });
  }

  // ── ハンバーガーボタン制御 ────────────────────────────────
  function _initToggle() {
    const toggle = document.querySelector(".site-nav__toggle");
    const menu = document.getElementById("site-nav-menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("show");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // メニュー外クリックで閉じる
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#site-nav")) {
        menu.classList.remove("show");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // リサイズでデスクトップ幅になったら閉じる
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) {
        menu.classList.remove("show");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ── 汎用 Collapse（data-bs-toggle="collapse" 互換） ────────
  // index.html の countdown セクションなど、
  // Bootstrap JS に依存していた箇所の代替。
  function _initCollapse() {
    document.querySelectorAll('[data-bs-toggle="collapse"]').forEach((btn) => {
      // 既にバインド済みならスキップ
      if (btn.dataset.collapseInit) return;
      btn.dataset.collapseInit = "1";

      btn.addEventListener("click", () => {
        const targetSel = btn.dataset.bsTarget;
        if (!targetSel) return;
        const target = document.querySelector(targetSel);
        if (!target) return;

        const isOpen = target.classList.toggle("show");
        btn.setAttribute("aria-expanded", String(isOpen));

        // hide/show カスタムイベントを発火（index.html の chevron 更新用）
        target.dispatchEvent(
          new CustomEvent(isOpen ? "show.bs.collapse" : "hide.bs.collapse"),
        );
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _initCollapse, {
      once: true,
    });
  }
  // ── Service Worker 登録 ──────────────────────────────────────
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch((err) => console.warn("SW registration failed:", err));
    });
  }
})();
