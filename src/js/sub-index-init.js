// ============================================================
// js/sub-index-init.js
//
// カテゴリ index.html から呼ばれる共通エンジン（リデザイン版）。
// URL の ?slug=history または /history/ などから slug を受け取り:
//   1. {slug}/list.json を fetch
//   2. #page-content だけを書き換える（body 全体を書き換えない）
//   3. カードを .card-grid で生成（Bootstrap 非依存）
//
// list.json の構造:
// {
//   "title": "History — Shoei451",
//   "h1": "History Tools",
//   "headerDesc": "世界史・中国史の学習ツール",
//   "backLink": "/index.html",
//   "sections": [
//     {
//       "title": "セクション名",
//       "desc": "説明文（省略可）",
//       "items": [
//         {
//           "title": "ページ名",
//           "description": "説明",
//           "link": "worldhistory/",
//           "icon": "../images/worldhistoryquiz.png",
//           "target": "_blank"   // 省略可
//         }
//       ]
//     }
//   ]
// }
// ============================================================

(function () {
  const slug = _resolveSlug();
  if (!slug) {
    _showError("カテゴリ slug を特定できませんでした。");
    return;
  }

  _fetchAndBuild(slug);

  async function _fetchAndBuild(slug) {
    let cfg;
    try {
      const res = await fetch("/" + slug + "/list.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cfg = await res.json();
    } catch (err) {
      _showError(`${slug}/list.json の読み込みに失敗しました: ${err.message}`);
      return;
    }

    // ページタイトル更新
    const plainH1 = (cfg.h1 || "").replace(/<[^>]+>/g, "").trim();
    document.title = cfg.title || plainH1 + " — Shoei451";

    // #page-content だけを書き換える
    const main = document.getElementById("page-content");
    if (!main) return;
    main.innerHTML = _buildHTML(cfg, slug);

    // アクセスログ
    navigator.sendBeacon(
      "/api/sw?path=" +
        encodeURIComponent(location.pathname + location.search) +
        "&ref=" +
        encodeURIComponent(document.referrer),
    );
  }

  function _resolveSlug() {
    const querySlug = new URLSearchParams(location.search).get("slug");
    if (querySlug) return querySlug.replace(/^\/+|\/+$/g, "");

    return location.pathname
      .split("/")
      .filter(Boolean)
      .filter((part) => part !== "index.html")[0];
  }

  // ── HTML 生成 ──────────────────────────────────────────────
  function _buildHTML(cfg, slug) {
    const backLink = cfg.backLink || "/index.html";
    const sectionsHTML = (cfg.sections || [])
      .map((section) => {
        const cardsHTML = (section.items || [])
          .map((item) => _cardHTML(item, slug))
          .join("");
        return `
        <div class="section-header">
          <h2 class="section-header__title">${_esc(section.title)}</h2>
          ${section.desc ? `<span class="section-header__desc">${_esc(section.desc)}</span>` : ""}
        </div>
        <div class="card-grid mb-4">
          ${cardsHTML}
        </div>
      `;
      })
      .join("");

    return `
      <div class="page-header">
        <a href="${_esc(backLink)}" class="back-link mb-2">
          <i class="bi bi-chevron-left"></i>
          ${cfg.backLabel || "ホーム"}
        </a>
        <h1 class="page-header__title">${cfg.h1 || ""}</h1>
        ${cfg.headerDesc ? `<p class="page-header__desc">${_esc(cfg.headerDesc)}</p>` : ""}
      </div>
      ${sectionsHTML}
    `;
  }

  function _cardHTML(item, slug) {
    const link = _fixLink(item.link || "#", slug);
    const target = item.target
      ? `target="${_esc(item.target)}" rel="noopener"`
      : "";
    const iconHTML = _resolveIcon(item.icon || "", slug);

    const titleEN = item.titleEN
      ? `<div class="en-label mb-1">${_esc(item.titleEN)}</div>`
      : "";

    return `
      <a href="${_esc(link)}" ${target} class="site-card text-decoration-none"
         style="display:flex; flex-direction:column; height:100%;">
        <div class="site-card__body" style="flex:1;">
          ${iconHTML}
          ${titleEN}
          <h5 class="site-card__title">${_esc(item.title)}</h5>
          ${item.description ? `<p class="site-card__text">${_esc(item.description)}</p>` : ""}
        </div>
      </a>
    `;
  }

  // ── アイコン種別判定 ───────────────────────────────────────
  function _resolveIcon(raw, slug) {
    if (!raw) return "";

    if (/^bi-[\w-]+$/.test(raw)) {
      return `<i class="bi ${_esc(raw)} site-card__bi-icon" aria-hidden="true"></i>`;
    }

    if (/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(raw) || _isAbsolute(raw)) {
      const src = _fixIcon(raw);
      return `<img src="${_esc(src)}" class="site-card__icon" alt="" loading="lazy">`;
    }

    return "";
  }

  // ── パス補正 ───────────────────────────────────────────────
  function _isAbsolute(s) {
    return (
      !s ||
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("/") ||
      s.startsWith("#") ||
      s.startsWith("mailto:")
    );
  }

  function _fixLink(link, slug) {
    if (_isAbsolute(link)) return link;
    if (link.startsWith(slug + "/")) return "/" + link;
    return "/" + slug + "/" + link;
  }

  function _fixIcon(icon) {
    if (_isAbsolute(icon)) return icon;
    return "/" + icon.replace(/^(\.\.\/)+/, "");
  }

  // ── エラー表示 ─────────────────────────────────────────────
  function _showError(msg) {
    const main = document.getElementById("page-content");
    if (main) {
      main.innerHTML = `
        <div style="
          margin-top:2rem; padding:1rem 1.25rem;
          border:1px solid var(--color-border);
          border-left:4px solid var(--color-accent);
          border-radius:6px;
          background:var(--color-surface);
          font-size:0.9rem; color:var(--color-text-secondary);">
          <i class="bi bi-exclamation-triangle me-2"></i>
          ${_esc(msg)}
        </div>
      `;
    }
  }

  function _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
