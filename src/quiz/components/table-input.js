// ============================================================
// quiz-components/answer/table-input.js
//
// 表形式クイズ（複数セル入力）のエンジン。
// 1問 = 1エンティティの属性表。空欄セルを埋めて全正解で次へ進む。
//
// 使い方:
//   1. HTML に <div id="qz-table-input"></div> を置く
//   2. showTableInput(config) を呼ぶ
//
// @typedef {Object} TableInputConfig
// @property {Object}   row              - 問題データ（1エンティティ分）
// @property {Array<{key:string, label:string}>} tableRows
//                                       - 表の行定義（全行。ヘッダー行含む）
// @property {string[]} blankKeys        - 空欄にするキーの配列
// @property {Function} isCorrect        - (key, inputValue, row) => boolean
// @property {Function} formatCell       - (key, row) => string  非空欄セルの表示値
// @property {string}   [headerKey]      - ヘッダー行として大きく表示するキー（デフォルト: "name"）
// @property {string}   [mountId]        - マウント先 id（デフォルト: "qz-table-input"）
// @property {Function} [onComplete]     - () => void  全セル正解時コールバック
//                                         省略時は window.enableNextButton() を呼ぶ
//
// ============================================================

(function () {
  const DEFAULT_ID = "qz-table-input";

  // 現在アクティブな input 要素のリスト（Tab/Enter ナビ用）
  let _inputs = [];

  /**
   * 表入力エリアを描画する。
   * @param {TableInputConfig} config
   */
  window.showTableInput = function (config) {
    const mountId = config.mountId ?? DEFAULT_ID;
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`showTableInput: #${mountId} が見つかりません`);
      return;
    }

    _inputs = [];
    const headerKey = config.headerKey ?? "name";

    const rows = config.tableRows.map((rowDef) => {
      const isHeader = rowDef.key === headerKey;
      const isBlank = config.blankKeys.includes(rowDef.key);
      return { rowDef, isHeader, isBlank };
    });

    // テーブル HTML 生成
    const tbodyHTML = rows
      .map(({ rowDef, isHeader, isBlank }) => {
        const trClass = isHeader ? ' class="qz-tbl-row--header"' : "";
        const th = `<th class="qz-tbl-th" scope="row">${_esc(rowDef.label)}</th>`;

        let td;
        if (isHeader) {
          td = `<td class="qz-tbl-td qz-tbl-td--name">${_esc(config.formatCell(rowDef.key, config.row))}</td>`;
        } else if (isBlank) {
          td = `<td class="qz-tbl-td qz-tbl-td--blank">
            <input
              class="qz-tbl-input"
              type="text"
              placeholder="…"
              data-key="${_esc(rowDef.key)}"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            >
          </td>`;
        } else {
          td = `<td class="qz-tbl-td qz-tbl-td--fixed">${_esc(config.formatCell(rowDef.key, config.row))}</td>`;
        }

        return `<tr${trClass}>${th}${td}</tr>`;
      })
      .join("");

    el.innerHTML = `
      <div class="qz-tbl-wrap">
        <table class="qz-tbl">
          <tbody>${tbodyHTML}</tbody>
        </table>
      </div>
    `;

    // input 要素を収集してイベント登録
    el.querySelectorAll(".qz-tbl-input").forEach((input) => {
      _inputs.push(input);
      input.addEventListener("input", () => _handleInput(input, config));
      input.addEventListener("keydown", (e) =>
        _handleKeydown(e, input, config),
      );
    });

    // 最初の input にフォーカス
    if (_inputs.length > 0) {
      setTimeout(() => _inputs[0].focus(), 60);
    } else {
      // 空欄なし = 即完了
      _onAllCorrect(config);
    }
  };

  /**
   * 表入力エリアをロックする（完了後に外部から呼ぶことも可）。
   * @param {string} [mountId]
   */
  window.lockTableInput = function (mountId = DEFAULT_ID) {
    const el = document.getElementById(mountId);
    if (!el) return;
    el.querySelectorAll(".qz-tbl-input").forEach((inp) => {
      inp.disabled = true;
    });
  };

  // ── 入力ハンドラ ──────────────────────────────────────────

  function _handleInput(input, config) {
    if (input.disabled) return;
    const val = input.value;
    if (!val) {
      input.className = "qz-tbl-input";
      return;
    }

    if (config.isCorrect(input.dataset.key, val, config.row)) {
      input.classList.add("is-correct");
      input.disabled = true;
      _focusNext(input);
      _checkAllCorrect(config);
    } else {
      input.classList.remove("is-correct");
    }
  }

  function _handleKeydown(e, input, config) {
    if (e.key !== "Enter" && e.key !== "Tab") return;
    e.preventDefault();

    // Enter / Tab で次の未完了セルへ移動
    // 正解でなくても移動は許可（ユーザーが後で戻れる）
    _focusNext(input);
  }

  // ── フォーカス管理 ────────────────────────────────────────

  function _focusNext(current) {
    const idx = _inputs.indexOf(current);
    const next = _inputs.slice(idx + 1).find((i) => !i.disabled);
    if (next) next.focus();
  }

  // ── 完了判定 ──────────────────────────────────────────────

  function _checkAllCorrect(config) {
    const allDone = _inputs.every((i) => i.disabled);
    if (allDone) _onAllCorrect(config);
  }

  function _onAllCorrect(config) {
    if (config.onComplete) {
      config.onComplete();
    } else {
      window.enableNextButton?.();
    }
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
