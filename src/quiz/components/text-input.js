// ============================================================
// quiz-components/answer/text-input.js
//
// 年号・記述テキスト入力フォームのエンジン。
// Enter キー送信・バリデーション・正誤判定を担当。
//
// 使い方:
//   1. HTML に <div id="qz-text-input"></div> を置く
//   2. showTextInput(inputConfig) を呼ぶ
//
// @typedef {Object} InputConfig
// @property {"number"|"text"} inputType    - 入力タイプ（デフォルト: "number"）
// @property {string}   [label]             - 入力欄のラベル（デフォルト: "年を入力"）
// @property {string}   [placeholder]       - プレースホルダー
// @property {string}   [hint]              - 入力欄下の補足テキスト（省略可）
// @property {number}   [maxLength]         - 最大文字数
// @property {string}   [mountId]           - マウント先 id（デフォルト: "qz-text-input"）
// @property {Function} validate            - (rawValue: string) => { ok: boolean, value: any, message?: string }
//                                            バリデーション。ok=false のときはエラーメッセージを表示する。
// @property {Function} onAnswer            - ({ rawValue, value, isCorrect }) => void
//
// ============================================================

(function () {
  const DEFAULT_ID = "qz-text-input";
  let _submitted = false;

  /**
   * テキスト入力フォームを描画する。
   * @param {InputConfig} config
   */
  window.showTextInput = function (config) {
    const mountId = config.mountId ?? DEFAULT_ID;
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`showTextInput: #${mountId} が見つかりません`);
      return;
    }

    _submitted = false;

    const inputType = config.inputType ?? "number";
    const label = config.label ?? "年を入力";
    const placeholder =
      config.placeholder ?? (inputType === "number" ? "例: 1789" : "");
    const hint = config.hint ?? (inputType === "number" ? "" : "");
    const maxLength = config.maxLength ?? "";

    el.innerHTML = `
      <div class="qz-input-wrap">
        <label class="qz-input-label" for="qz-answer-input">${_esc(label)}</label>
        <div class="qz-input-row">
          <input
            class="qz-answer-input"
            id="qz-answer-input"
            type="${inputType === "number" ? "text" : "text"}"
            inputmode="${inputType === "number" ? "numeric" : "text"}"
            placeholder="${_esc(placeholder)}"
            ${maxLength ? `maxlength="${maxLength}"` : ""}
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          >
          <button class="qz-btn qz-btn--primary qz-btn--sm" id="qz-submit-btn" type="button">
            回答する
          </button>
        </div>
        ${hint ? `<p class="qz-input-hint">${_esc(hint)}</p>` : ""}
        <p class="qz-input-error" id="qz-input-error"></p>
      </div>
    `;

    const input = el.querySelector("#qz-answer-input");
    const submit = el.querySelector("#qz-submit-btn");

    input.focus();

    submit.addEventListener("click", () => _submit(config, input, submit));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") _submit(config, input, submit);
    });
  };

  /**
   * 入力欄をロックする（回答確定後）。
   * @param {string} [mountId]
   */
  window.lockTextInput = function (mountId = DEFAULT_ID) {
    const input = document.querySelector(`#${mountId} #qz-answer-input`);
    const submit = document.querySelector(`#${mountId} #qz-submit-btn`);
    if (input) {
      input.disabled = true;
      input.classList.add("is-locked");
    }
    if (submit) {
      submit.disabled = true;
    }
  };

  // ── 送信処理 ──────────────────────────────────────────────

  function _submit(config, input, submitBtn) {
    if (_submitted) return;

    const raw = input.value.trim();
    const result = config.validate
      ? config.validate(raw)
      : { ok: !!raw, value: raw };

    if (!result.ok) {
      _showError(result.message ?? "入力を確認してください");
      input.focus();
      return;
    }

    _submitted = true;
    _clearError();
    window.lockTextInput?.(config.mountId);
    window.enableNextButton?.();

    if (config.onAnswer) {
      config.onAnswer({
        rawValue: raw,
        value: result.value,
        isCorrect: result.isCorrect ?? false,
      });
    }
  }

  function _showError(msg) {
    const el = document.getElementById("qz-input-error");
    if (el) {
      el.textContent = msg;
      el.classList.add("is-visible");
    }
  }

  function _clearError() {
    const el = document.getElementById("qz-input-error");
    if (el) {
      el.textContent = "";
      el.classList.remove("is-visible");
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
