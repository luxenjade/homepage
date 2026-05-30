// ============================================================
// quiz-components/question/question-area.js
//
// 問題文・カテゴリチップ・補足テキスト・画像を表示するエンジン。
//
// 使い方:
//   1. HTML に <div id="qz-question-area"></div> を置く
//   2. showQuestion(questionData) を呼ぶたびに内容が書き換わる
//
// @typedef {Object} QuestionData
// @property {string}   [text]        - 問題文（プレーンテキスト）
// @property {string}   [template]    - 問題文テンプレート（"{{key}}" 記法）
//                                      text と排他。template が優先される。
// @property {Object}   [vars]        - template 内の置換変数
//                                      例: { name: "む", colLabel: "接続" }
//                                      キーを <strong> で強調するには vars に
//                                      { name: { value: "む", strong: true } } と渡す。
// @property {string}   [sub]         - 補足テキスト（例: 日本語訳・接続情報）
// @property {string}   [category]    - カテゴリラベル（チップ表示）
// @property {string}   [imageUrl]    - 問題画像のURL（省略可）
// @property {string}   [imageAlt]    - 画像の alt テキスト
//
// ============================================================

(function () {
  const DEFAULT_ID = "qz-question-area";

  /**
   * 問題エリアに問題を表示する。
   * @param {QuestionData} data
   * @param {string} [mountId]
   */
  window.showQuestion = function (data, mountId = DEFAULT_ID) {
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`showQuestion: #${mountId} が見つかりません`);
      return;
    }

    const chip = data.category
      ? `<span class="qz-category-chip">${_esc(data.category)}</span>`
      : "";

    const img = data.imageUrl
      ? `<img class="qz-question-image" src="${_esc(data.imageUrl)}"
              alt="${_esc(data.imageAlt ?? "問題画像")}">`
      : "";

    const sub = data.sub
      ? `<p class="qz-question-sub">${_esc(data.sub)}</p>`
      : "";

    const questionHTML = data.template
      ? _renderTemplate(data.template, data.vars ?? {})
      : `<p class="qz-question-text">${_esc(data.text ?? "")}</p>`;

    el.innerHTML = `
      <div class="qz-question">
        ${chip}
        ${img}
        ${questionHTML}
        ${sub}
      </div>
    `;
  };

  // ── テンプレートレンダラー ────────────────────────────────
  //
  // "{{key}}" を vars[key] で置換する。
  // vars[key] が { value, strong: true } の形式なら <strong class="qz-q-em"> で囲む。
  // それ以外はプレーンテキストとして HTML エスケープして挿入。

  function _renderTemplate(template, vars) {
    const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = vars[key];
      if (v == null) return "";
      if (typeof v === "object" && v.strong) {
        return `<strong class="qz-q-em">${_esc(String(v.value ?? ""))}</strong>`;
      }
      return _esc(String(v));
    });
    return `<p class="qz-question-text">${html}</p>`;
  }

  function _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
