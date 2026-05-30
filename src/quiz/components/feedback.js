// ============================================================
// quiz-components/feedback/feedback.js
//
// 正解・不正解バナーの表示エンジン。
// ページ固有の追加コンテンツ（解説・年号補足など）は
// extraHtml または extraRenderer で差し込む。
//
// 使い方:
//   1. HTML に <div id="qz-feedback"></div> を置く
//   2. showFeedback(feedbackData) を呼ぶ
//   3. hideFeedback() で非表示にする（次の問題に移る前）
//
// @typedef {Object} FeedbackData
// @property {boolean}  isCorrect      - 正解かどうか
// @property {string}   [correctLabel] - 正解テキスト表示（例: "前221年"）
// @property {string}   [userLabel]    - ユーザーの回答表示（不正解時に使う）
// @property {string}   [extraHtml]    - 追加表示するHTML文字列（信頼済みのみ）
// @property {Function} [extraRenderer] - (el: HTMLElement) => void
//                                        extraHtml より安全な代替。DOM操作で追記する。
// @property {string}   [mountId]      - マウント先 id（デフォルト: "qz-feedback"）
//
// ============================================================

(function () {
  const DEFAULT_ID = "qz-feedback";

  /**
   * フィードバックバナーを表示する。
   * @param {FeedbackData} data
   */
  window.showFeedback = function (data) {
    const mountId = data.mountId ?? DEFAULT_ID;
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`showFeedback: #${mountId} が見つかりません`);
      return;
    }
    const extraEl = _ensureExtraMount(el);

    const modifier = data.isCorrect ? "correct" : "incorrect";
    const icon = data.isCorrect ? "✓" : "✗";
    const headline = data.isCorrect ? "正解！" : "不正解";

    // 不正解時: 正解を表示
    const correctLine =
      !data.isCorrect && data.correctLabel
        ? `<p class="qz-feedback__correct-answer">
           正解：<strong>${_esc(data.correctLabel)}</strong>
         </p>`
        : "";

    // ユーザー回答を表示（不正解時のみ）
    const userLine =
      !data.isCorrect && data.userLabel
        ? `<p class="qz-feedback__user-answer">
           あなたの回答：<span>${_esc(data.userLabel)}</span>
         </p>`
        : "";

    el.className = `qz-feedback qz-feedback--${modifier}`;
    el.innerHTML = `
      <div class="qz-feedback__main">
        <span class="qz-feedback__icon">${icon}</span>
        <span class="qz-feedback__headline">${headline}</span>
      </div>
      ${correctLine}
      ${userLine}
    `;
    el.classList.remove("hidden");
    extraEl.className = "qz-feedback__extra";
    extraEl.innerHTML = "";

    // extraRenderer があれば DOM 操作で追記
    if (data.extraRenderer) {
      data.extraRenderer(extraEl);
    } else if (data.extraHtml) {
      extraEl.innerHTML = data.extraHtml;
    }

    if (!extraEl.innerHTML.trim()) {
      extraEl.classList.add("hidden");
    } else {
      extraEl.classList.remove("hidden");
    }

    // スムーズスクロール（フィードバックが画面外のとき）
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /**
   * フィードバックバナーを隠す。
   * @param {string} [mountId]
   */
  window.hideFeedback = function (mountId = DEFAULT_ID) {
    const el = document.getElementById(mountId);
    if (el) el.classList.add("hidden");
    const extraEl = document.getElementById(`${mountId}-extra`);
    if (extraEl) {
      extraEl.classList.add("hidden");
      extraEl.innerHTML = "";
    }
  };

  function _ensureExtraMount(el) {
    const extraId = `${el.id}-extra`;
    let extraEl = document.getElementById(extraId);
    if (extraEl) return extraEl;

    extraEl = document.createElement("div");
    extraEl.id = extraId;
    extraEl.className = "qz-feedback__extra hidden";
    el.insertAdjacentElement("afterend", extraEl);
    return extraEl;
  }

  function _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
