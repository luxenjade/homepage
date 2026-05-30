// ============================================================
// quiz-components/progress/progress.js
//
// 進捗バー + ナビボタン（次へ・リセット）の共通エンジン。
//
// 使い方:
//   1. HTML に以下を置く（id は変更可）
//      <div id="qz-progress-bar"></div>       ← 進捗バー
//      <div id="qz-nav-buttons"></div>        ← ナビボタン
//
//   2. initProgress(config) を呼ぶ
//
// @typedef {Object} ProgressConfig
// @property {number}   total          - 総問題数
// @property {string}   [barId]        - 進捗バーのマウント先 id（デフォルト: "qz-progress-bar"）
// @property {string}   [navId]        - ナビボタンのマウント先 id（デフォルト: "qz-nav-buttons"）
// @property {string}   [nextLabel]    - 「次へ」ボタンのラベル（デフォルト: "次の問題"）
// @property {string}   [lastLabel]    - 最後の問題の「次へ」ラベル（デフォルト: "結果を見る"）
// @property {string}   [resetLabel]   - リセットボタンのラベル（デフォルト: "最初に戻る"）
// @property {string}   [resetConfirm] - リセット確認メッセージ（null で確認なし）
// @property {Function} onNext         - 次の問題へ進むときのコールバック (currentIndex: number) => void
// @property {Function} onReset        - リセット時のコールバック () => void
//
// ============================================================

(function () {
  let _config = null;
  let _current = 0; // 0-indexed、現在表示中の問題番号

  // ── パブリック API ─────────────────────────────────────────

  /**
   * 進捗コンポーネントを初期化する。
   * @param {ProgressConfig} config
   */
  window.initProgress = function (config) {
    _config = config;
    _current = 0;
    _render();
  };

  /**
   * 「次へ」ボタンを有効化する（回答確定後に呼ぶ）。
   */
  window.enableNextButton = function () {
    const btn = document.getElementById("qz-next-btn");
    if (btn) btn.disabled = false;
  };

  /**
   * 「次へ」ボタンを無効化する（問題表示直後に呼ぶ）。
   */
  window.disableNextButton = function () {
    const btn = document.getElementById("qz-next-btn");
    if (btn) btn.disabled = true;
  };

  /**
   * 進捗を n 問目（0-indexed）に更新する。
   * バーの幅・カウンター・ボタンラベルが変わる。
   * @param {number} index - 0-indexed
   */
  window.updateProgress = function (index) {
    if (!_config) return;
    _current = index;
    _updateBar();
    _updateNextLabel();
  };

  // ── 描画 ─────────────────────────────────────────────────

  function _render() {
    _renderBar();
    _renderNav();
  }

  function _renderBar() {
    const barId = _config.barId ?? "qz-progress-bar";
    const el = document.getElementById(barId);
    if (!el) return;

    el.innerHTML = `
      <div class="qz-progress-wrap">
        <div class="qz-progress">
          <div class="qz-progress__fill" id="qz-progress-fill" style="width:0%"></div>
        </div>
        <div class="qz-progress-counter" id="qz-progress-counter">
          <span id="qz-progress-current">1</span> / ${_config.total}
        </div>
      </div>
    `;
  }

  function _renderNav() {
    const navId = _config.navId ?? "qz-nav-buttons";
    const el = document.getElementById(navId);
    if (!el) return;

    const nextLabel = _config.nextLabel ?? "次の問題";
    const resetLabel = _config.resetLabel ?? "最初に戻る";

    // innerHTML を差し替えることで古いリスナーごと破棄し、累積を防ぐ
    el.innerHTML = `
      <div class="qz-nav">
        <button class="qz-btn qz-btn--ghost qz-btn--sm" id="qz-reset-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
          <span class="qz-reset-label">${nextLabel !== "次の問題" ? "Reset" : resetLabel}</span>
        </button>
        <button class="qz-btn qz-btn--primary qz-btn--sm" id="qz-next-btn" type="button" disabled>
          <span class="qz-next-label">${nextLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    `;

    // innerHTML 再生成後に新しい要素へリスナーを1回だけ付ける
    document.getElementById("qz-next-btn").addEventListener("click", _onNext);
    document.getElementById("qz-reset-btn").addEventListener("click", _onReset);
  }

  // ── 更新 ──────────────────────────────────────────────────

  function _updateBar() {
    const fill = document.getElementById("qz-progress-fill");
    const counter = document.getElementById("qz-progress-current");
    if (!fill || !_config) return;

    const pct = Math.round(((_current + 1) / _config.total) * 100);
    fill.style.width = pct + "%";
    if (counter) counter.textContent = _current + 1;
  }

  function _updateNextLabel() {
    const btn = document.getElementById("qz-next-btn");
    if (!btn || !_config) return;

    const isLast = _current >= _config.total - 1;
    const nextLabel = _config.nextLabel ?? "次の問題";
    const lastLabel = _config.lastLabel ?? "結果を見る";

    // <span class="qz-next-label"> だけを書き換える（SVGは触らない）
    const labelEl = btn.querySelector(".qz-next-label");
    if (labelEl) labelEl.textContent = isLast ? lastLabel : nextLabel;
  }

  // ── イベントハンドラ ───────────────────────────────────────

  function _onNext() {
    if (!_config) return;
    window.disableNextButton();
    if (_config.onNext) _config.onNext(_current);
  }

  function _onReset() {
    if (!_config) return;
    const msg =
      _config.resetConfirm ?? "最初に戻りますか？\n進捗はリセットされます。";
    if (msg && !confirm(msg)) return;
    if (_config.onReset) _config.onReset();
  }
})();
