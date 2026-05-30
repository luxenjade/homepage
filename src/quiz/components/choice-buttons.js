// ============================================================
// quiz-components/answer/choice-buttons.js
//
// 4択ボタンの描画・正誤判定・コールバック注入エンジン。
//
// @typedef {Object} ChoiceConfig
// @property {string[]|Object[]} options  - 選択肢の配列
//                                          プレーン文字列 or { value: string, ... } のオブジェクト
// @property {string}    correct          - 正解の value 文字列
// @property {string}    [mountId]        - マウント先 id（デフォルト: "qz-choices"）
// @property {Function}  [renderChoice]   - (opt, index) => string
//                                          HTML文字列を返す。未定義時はプレーンテキスト表示。
// @property {Function}  [onAnswer]       - ({ selected, correct, isCorrect, buttons }) => void
//
// ============================================================

(function () {
  const DEFAULT_ID = "qz-choices";

  window.showChoices = function (config) {
    const mountId = config.mountId ?? DEFAULT_ID;
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`showChoices: #${mountId} が見つかりません`);
      return;
    }

    el.innerHTML = config.options
      .map((opt, i) => {
        // opt がオブジェクトの場合は opt.value、文字列の場合はそのまま value として使う
        const value = typeof opt === "object" ? opt.value : opt;

        const inner = config.renderChoice
          ? config.renderChoice(opt, i)
          : `<span class="qz-choice__text">${_esc(value)}</span>`;

        return `
          <button class="qz-choice" data-index="${i}" data-value="${_esc(value)}" type="button">
            <span class="qz-choice__letter">${_letter(i)}</span>
            ${inner}
          </button>
        `;
      })
      .join("");

    el.querySelectorAll(".qz-choice").forEach((btn) => {
      btn.addEventListener("click", () => _handleAnswer(btn, config, el));
    });
  };

  // ── 回答処理 ──────────────────────────────────────────────

  function _handleAnswer(clicked, config, container) {
    const buttons = container.querySelectorAll(".qz-choice");
    buttons.forEach((b) => {
      b.disabled = true;
      b.classList.add("is-locked");
    });

    const selected = clicked.dataset.value;
    const isCorrect = selected === config.correct;

    buttons.forEach((b) => {
      if (b.dataset.value === config.correct) {
        b.classList.add("is-correct");
      } else if (b === clicked && !isCorrect) {
        b.classList.add("is-incorrect");
      }
    });

    window.enableNextButton?.();

    if (config.onAnswer) {
      config.onAnswer({
        selected,
        correct: config.correct,
        isCorrect,
        buttons: [...buttons],
      });
    }
  }

  // ── ユーティリティ ─────────────────────────────────────────

  function _letter(i) {
    return ["A", "B", "C", "D", "E", "F"][i] ?? String(i + 1);
  }

  function _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
