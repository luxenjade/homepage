// ============================================================
// quiz-components/start/start-screen.js
//
// config オブジェクトを受け取り、スタート画面を描画するエンジン。
// marked.js が読み込まれている場合はチュートリアルのMarkdownをパースする。
//
// 使い方:
//   1. HTML に <div id="start-screen" class="qz-screen hidden"></div> を置く
//   2. QUIZ_CONFIG を定義して initStartScreen(QUIZ_CONFIG) を呼ぶ
//
// QUIZ_CONFIG の型定義（JSDoc）:
//
// @typedef {Object} QuizConfig
// @property {string}   title          - クイズタイトル
// @property {string}   [subtitle]     - サブタイトル（省略可）
// @property {string}   [image]        - ヒーロー画像のURL（省略可）
// @property {string}   [tutorialMd]   - チュートリアルMarkdownのURL（省略可）
// @property {"multi"|"single"|"none"} rangeMode - 範囲選択の種類
// @property {Array<{id:string, label:string}>} [ranges] - 範囲の選択肢
// @property {string}   [rangeLabel]   - 範囲選択ブロックのラベル（デフォルト: "出題範囲"）
// @property {"slider"|"select"} countMode - 出題数UIの種類
// @property {number}   [countMin]     - スライダー最小値（slider時）
// @property {number}   [countMax]     - スライダー最大値（slider時）
// @property {number}   [countDefault] - デフォルト出題数
// @property {Array<number|"all">} [countOptions] - select時の選択肢
// @property {string}   [startLabel]   - 開始ボタンのテキスト（デフォルト: "クイズを開始"）
// @property {Function} onStart        - (selectedRanges: string[], count: number|"all") => void
//
// ============================================================

(function () {
  // ── 内部状態 ──────────────────────────────────────────────
  let _config = null;
  let _selected = new Set(); // multi 選択中の range id
  let _count = 10; // 現在の出題数
  let _tutorialUI = null;

  // ── パブリック API ─────────────────────────────────────────

  /**
   * スタート画面を初期化・表示する。
   * @param {QuizConfig} config
   * @param {string} [mountId="start-screen"]  - マウント先要素の id
   */
  window.initStartScreen = function (config, mountId = "start-screen") {
    _config = config;
    _selected = new Set();
    _count = config.countDefault ?? 10;

    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`initStartScreen: #${mountId} が見つかりません`);
      return;
    }

    el.innerHTML = _buildHTML(config);
    el.classList.remove("hidden");

    _bindEvents(el, config);

    _destroyTutorial();

    // チュートリアルがある場合のみボタンを表示
    if (config.tutorialMd) {
      _initTutorial(config.tutorialMd);
    }
  };

  // ── HTML 生成 ─────────────────────────────────────────────

  function _buildHTML(cfg) {
    return `
      <div class="qz-start">
        ${_heroHTML(cfg)}
        ${cfg.rangeMode !== "none" ? _rangeHTML(cfg) : ""}
        ${_countHTML(cfg)}
        <div class="qz-start__footer">
          <button class="qz-btn qz-btn--primary" id="qz-start-btn" disabled>
            ${_esc(cfg.startLabel ?? "クイズを開始")}
          </button>
        </div>
      </div>
    `;
  }

  function _heroHTML(cfg) {
    const img = cfg.image
      ? `<img class="qz-start__image" src="${_esc(cfg.image)}" alt="${_esc(cfg.title)}">`
      : "";
    const sub = cfg.subtitle
      ? `<p class="qz-start__subtitle">${_esc(cfg.subtitle)}</p>`
      : "";
    return `
      <div class="qz-start__hero">
        ${img}
        <h1 class="qz-start__title">${_esc(cfg.title)}</h1>
        ${sub}
      </div>
    `;
  }

  function _rangeHTML(cfg) {
    const label = cfg.rangeLabel ?? "出題範囲";

    if (cfg.rangeMode === "multi") {
      const chips = (cfg.ranges ?? [])
        .map(
          (r) => `
        <button class="qz-chip" data-range-id="${_esc(r.id)}" type="button">
          ${_esc(r.label)}
        </button>
      `,
        )
        .join("");

      return `
        <div class="qz-start__block">
          <p class="qz-section-title">${_esc(label)}（複数選択可）</p>
          <div class="qz-range-chips__controls">
            <button class="qz-btn qz-btn--ghost" id="qz-select-all" type="button"
                    style="font-size:0.8rem; padding:0.4rem 0.9rem;">全選択</button>
            <button class="qz-btn qz-btn--ghost" id="qz-deselect-all" type="button"
                    style="font-size:0.8rem; padding:0.4rem 0.9rem;">解除</button>
          </div>
          <div class="qz-range-chips">${chips}</div>
        </div>
      `;
    }

    if (cfg.rangeMode === "single") {
      const items = (cfg.ranges ?? [])
        .map(
          (r) => `
        <button class="qz-range-item" data-range-id="${_esc(r.id)}" type="button">
          ${_esc(r.label)}
        </button>
      `,
        )
        .join("");

      return `
        <div class="qz-start__block">
          <p class="qz-section-title">${_esc(label)}</p>
          <div class="qz-range-list">${items}</div>
        </div>
      `;
    }

    return "";
  }

  function _countHTML(cfg) {
    if (cfg.countMode === "select") {
      const options = (cfg.countOptions ?? [10, 20, 30, "all"])
        .map(
          (v) =>
            `<option value="${v}" ${v === (cfg.countDefault ?? 10) ? "selected" : ""}>
          ${v === "all" ? "全問" : `${v}問`}
        </option>`,
        )
        .join("");

      return `
        <div class="qz-start__block">
          <p class="qz-section-title">出題数</p>
          <select class="qz-count-select" id="qz-count-select">${options}</select>
        </div>
      `;
    }

    // slider（デフォルト）
    const min = cfg.countMin ?? 5;
    const max = cfg.countMax ?? 50;
    const def = cfg.countDefault ?? 10;

    return `
      <div class="qz-start__block">
        <p class="qz-section-title">出題数</p>
        <div class="qz-count-slider">
          <input type="range" id="qz-count-range"
                 min="${min}" max="${max}" value="${def}" step="1">
          <input type="number" id="qz-count-input"
                 min="${min}" max="${max}" value="${def}">
          <span style="font-size:0.85rem; color:var(--qz-text-sub);">問</span>
        </div>
      </div>
    `;
  }

  // ── イベントバインド ───────────────────────────────────────

  function _bindEvents(el, cfg) {
    // ---- 範囲選択 ----
    if (cfg.rangeMode === "multi") {
      el.querySelectorAll(".qz-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.rangeId;
          if (_selected.has(id)) {
            _selected.delete(id);
            btn.classList.remove("is-selected");
          } else {
            _selected.add(id);
            btn.classList.add("is-selected");
          }
          _updateStartBtn(el, cfg);
        });
      });

      el.querySelector("#qz-select-all")?.addEventListener("click", () => {
        (cfg.ranges ?? []).forEach((r) => _selected.add(r.id));
        el.querySelectorAll(".qz-chip").forEach((b) =>
          b.classList.add("is-selected"),
        );
        _updateStartBtn(el, cfg);
      });

      el.querySelector("#qz-deselect-all")?.addEventListener("click", () => {
        _selected.clear();
        el.querySelectorAll(".qz-chip").forEach((b) =>
          b.classList.remove("is-selected"),
        );
        _updateStartBtn(el, cfg);
      });
    }

    if (cfg.rangeMode === "single") {
      el.querySelectorAll(".qz-range-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          el.querySelectorAll(".qz-range-item").forEach((b) =>
            b.classList.remove("is-selected"),
          );
          btn.classList.add("is-selected");
          _selected.clear();
          _selected.add(btn.dataset.rangeId);
          _updateStartBtn(el, cfg);
        });
      });
    }

    // rangeMode === "none" の場合は最初からボタンを有効化
    if (cfg.rangeMode === "none") {
      _updateStartBtn(el, cfg);
    }

    // ---- 出題数 ----
    if (cfg.countMode === "select") {
      el.querySelector("#qz-count-select")?.addEventListener("change", (e) => {
        _count = e.target.value === "all" ? "all" : parseInt(e.target.value);
      });
    } else {
      const range = el.querySelector("#qz-count-range");
      const input = el.querySelector("#qz-count-input");

      range?.addEventListener("input", () => {
        _count = parseInt(range.value);
        if (input) input.value = range.value;
      });

      input?.addEventListener("change", () => {
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        let val = parseInt(input.value);
        if (isNaN(val)) val = _count;
        val = Math.max(min, Math.min(max, val));
        input.value = val;
        _count = val;
        if (range) range.value = val;
      });
    }

    // ---- 開始ボタン ----
    el.querySelector("#qz-start-btn")?.addEventListener("click", () => {
      if (cfg.onStart) {
        cfg.onStart([..._selected], _count);
      }
    });
  }

  function _updateStartBtn(el, cfg) {
    const btn = el.querySelector("#qz-start-btn");
    if (!btn) return;
    const hasRange = cfg.rangeMode === "none" || _selected.size > 0;
    btn.disabled = !hasRange;
  }

  // ── チュートリアル ─────────────────────────────────────────

  function _destroyTutorial() {
    if (!_tutorialUI) return;

    const { btn, overlay, panel, onKeydown } = _tutorialUI;
    document.removeEventListener("keydown", onKeydown);
    btn?.remove();
    overlay?.remove();
    panel?.remove();
    _tutorialUI = null;
  }

  function _initTutorial(mdUrl) {
    // ボタンはヘッダー操作群に追加し、オーバーレイ・パネルは body に追加
    const btn = document.createElement("button");
    btn.className = "qz-tutorial-btn";
    btn.title = "使い方を見る";
    btn.innerHTML = "?";
    btn.setAttribute("aria-label", "チュートリアルを開く");

    const overlay = document.createElement("div");
    overlay.className = "qz-tutorial-overlay";

    const panel = document.createElement("div");
    panel.className = "qz-tutorial-panel";
    panel.innerHTML = `
      <div class="qz-tutorial-panel__header">
        <span class="qz-tutorial-panel__title">使い方</span>
        <button class="qz-tutorial-panel__close" aria-label="閉じる">×</button>
      </div>
      <div class="qz-tutorial-content">
        <p style="color:var(--qz-text-sub); font-size:0.85rem;">読み込み中...</p>
      </div>
    `;

    const headerActions = document.querySelector(".qz-header__actions");
    if (headerActions) {
      headerActions.appendChild(btn);
    } else {
      document.body.appendChild(btn);
    }
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    const content = panel.querySelector(".qz-tutorial-content");

    // Markdown 読み込み（marked.js があれば使う）
    fetch(mdUrl)
      .then((r) => r.text())
      .then((md) => {
        if (!content) return;
        if (typeof marked !== "undefined") {
          content.innerHTML = marked.parse(md);
        } else {
          // marked がなければ <pre> で表示
          content.innerHTML = `<pre style="white-space:pre-wrap;font-size:0.85rem;">${_esc(md)}</pre>`;
        }
      })
      .catch(() => {
        if (content)
          content.innerHTML = `<p style="color:var(--qz-text-sub)">チュートリアルを読み込めませんでした。</p>`;
      });

    // 開閉
    function open() {
      panel.classList.add("is-open");
      overlay.classList.add("is-open");
    }
    function close() {
      panel.classList.remove("is-open");
      overlay.classList.remove("is-open");
    }

    btn.addEventListener("click", open);
    overlay.addEventListener("click", close);
    panel
      .querySelector(".qz-tutorial-panel__close")
      ?.addEventListener("click", close);
    const onKeydown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeydown);

    _tutorialUI = { btn, overlay, panel, onKeydown };
  }

  // ── ユーティリティ ─────────────────────────────────────────

  function _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
