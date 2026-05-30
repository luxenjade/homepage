// ============================================================
// quiz-components/result/result.js
//
// 結果画面（スコア・正答率・復習リスト）のエンジン。
//
// 使い方:
//   1. HTML に <div id="result-screen" class="qz-screen hidden"></div> を置く
//   2. showResult(resultConfig) を呼ぶ
//
// @typedef {Object} ResultConfig
// @property {number}   correct        - 正解数
// @property {number}   total          - 総問題数
// @property {Array}    [mistakes]     - 間違えた問題の配列
// @property {Function} [renderMistake] - (item) => string  1件分のHTMLを返す関数
//                                        省略時はデフォルトレンダラーを使う
// @property {string}   [mountId]      - マウント先 id（デフォルト: "result-screen"）
// @property {string}   [retryLabel]   - 「もう一度」ボタンラベル
// @property {string}   [retryMistakesLabel] - 「間違えた問題だけ」ボタンラベル
// @property {Function} [onRetry]      - () => void  最初からやり直し
// @property {Function} [onRetryMistakes] - (mistakes) => void  復習モード
//
// デフォルトの mistake オブジェクト想定:
//   { questionText, userAnswer, correctAnswer, category? }
//
// ============================================================

(function () {
  const DEFAULT_ID = "result-screen";

  /**
   * 結果画面を表示する。
   * @param {ResultConfig} config
   */
  window.showResult = function (config) {
    const mountId = config.mountId ?? DEFAULT_ID;
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`showResult: #${mountId} が見つかりません`);
      return;
    }

    const pct = Math.round((config.correct / config.total) * 100);
    const grade = _grade(pct);
    const mistakes = config.mistakes ?? [];

    el.innerHTML = `
      <div class="qz-result">

        <!-- スコアサマリ -->
        <div class="qz-result__summary">
          <div class="qz-result__grade">${grade.emoji}</div>
          <div class="qz-result__score">${config.correct}<span class="qz-result__total"> / ${config.total}</span></div>
          <div class="qz-result__pct">${pct}%</div>
          <p class="qz-result__message">${_esc(grade.message)}</p>
        </div>

        <!-- 統計カード -->
        <div class="qz-result__stats">
          <div class="qz-result__stat">
            <div class="qz-result__stat-num qz-result__stat-num--correct">${config.correct}</div>
            <div class="qz-result__stat-label">正解</div>
          </div>
          <div class="qz-result__stat">
            <div class="qz-result__stat-num qz-result__stat-num--incorrect">${config.total - config.correct}</div>
            <div class="qz-result__stat-label">不正解</div>
          </div>
          <div class="qz-result__stat">
            <div class="qz-result__stat-num">${config.total}</div>
            <div class="qz-result__stat-label">出題数</div>
          </div>
        </div>

        <!-- ボタン -->
        <div class="qz-result__actions">
          <button class="qz-btn qz-btn--ghost" id="qz-retry-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
            </svg>
            ${_esc(config.retryLabel ?? "もう一度挑戦")}
          </button>
          ${
            mistakes.length > 0
              ? `
            <button class="qz-btn qz-btn--primary" id="qz-retry-mistakes-btn" type="button">
              ${_esc(config.retryMistakesLabel ?? "間違えた問題だけ")}
              <span class="qz-result__badge">${mistakes.length}</span>
            </button>
          `
              : ""
          }
        </div>

        <!-- 復習リスト -->
        ${
          mistakes.length > 0
            ? `
          <div class="qz-result__review">
            <p class="qz-section-title">復習リスト（${mistakes.length}問）</p>
            <div class="qz-review-list" id="qz-review-list"></div>
          </div>
        `
            : `
          <div class="qz-result__perfect">
            🎉 全問正解！素晴らしいです！
          </div>
        `
        }

      </div>
    `;

    el.classList.remove("hidden");

    // 復習リストを描画
    if (mistakes.length > 0) {
      const listEl = el.querySelector("#qz-review-list");
      mistakes.forEach((item) => {
        const div = document.createElement("div");
        div.className = "qz-review-item";
        if (config.renderMistake) {
          div.innerHTML = config.renderMistake(item);
        } else {
          div.innerHTML = _defaultMistakeHTML(item);
        }
        listEl.appendChild(div);
      });
    }

    // ボタンイベント
    el.querySelector("#qz-retry-btn")?.addEventListener("click", () => {
      if (config.onRetry) config.onRetry();
    });

    el.querySelector("#qz-retry-mistakes-btn")?.addEventListener(
      "click",
      () => {
        if (config.onRetryMistakes) config.onRetryMistakes(mistakes);
      },
    );
  };

  // ── デフォルト復習アイテムレンダラー ─────────────────────

  function _defaultMistakeHTML(item) {
    const chip = item.category
      ? `<span class="qz-category-chip" style="font-size:0.7rem;">${_esc(item.category)}</span>`
      : "";
    return `
      <div class="qz-review-item__header">
        ${chip}
        <p class="qz-review-item__question">${_esc(item.questionText ?? "")}</p>
      </div>
      <div class="qz-review-item__answers">
        <span class="qz-review-item__user">
          あなた：${_esc(String(item.userAnswer ?? ""))}
        </span>
        <span class="qz-review-item__correct">
          正解：<strong>${_esc(String(item.correctAnswer ?? ""))}</strong>
        </span>
      </div>
    `;
  }

  // ── 評価メッセージ ─────────────────────────────────────────

  function _grade(pct) {
    if (pct === 100) return { emoji: "🏆", message: "パーフェクト！" };
    if (pct >= 80) return { emoji: "🎉", message: "よくできました！" };
    if (pct >= 60)
      return { emoji: "📚", message: "もう少し！復習してみよう。" };
    return { emoji: "💪", message: "次は頑張ろう。復習リストを活用して！" };
  }

  function _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
