// ============================================================
// quiz/logic.js
//
// 全クイズ共通エンジン。QUIZ_CONFIG の内容を知らない。
// config が渡す関数を呼ぶだけ。
//
// 依存: quiz/components/* (index.html 側でロード済み)
//       /js/supabase_config.js → window.db, window.SUPABASE_TABLES
// ============================================================

// ── ユーティリティ ─────────────────────────────────────────

function _shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function _formatYear(y) {
  if (y == null) return "不明";
  return y < 0 ? `前${Math.abs(y)}年` : `${y}年`;
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── 状態 ──────────────────────────────────────────────────

let _cfg = null;
let _allData = [];
let _quizSet = [];
let _currentIndex = 0;
let _correctCount = 0;
let _mistakes = [];

// ── エントリポイント ───────────────────────────────────────

window.initQuizLogic = function (cfg) {
  _cfg = cfg;
  _allData = [];
  _resetState();

  window._quizFormatYear = _formatYear;
  window._quizShuffle = _shuffle;

  if (window.db && !window._db) {
    window._db = window.db;
  }

  _showScreen("start-screen");
  _renderStartScreen();
};

// ── スタート画面 ──────────────────────────────────────────

function _renderStartScreen() {
  const startConfig = {
    title: _cfg.title,
    subtitle: _cfg.subtitle ?? null,
    image: _cfg.image ?? null,
    tutorialMd: _cfg.tutorialMd ?? null,
    rangeMode: _cfg.rangeMode,
    rangeLabel: _cfg.rangeLabel ?? "出題範囲",
    ranges: _cfg.ranges ?? [],
    countMode: _cfg.countMode ?? "select",
    countMin: _cfg.countMin ?? 5,
    countMax: _cfg.countMax ?? 50,
    countDefault: _cfg.countDefault ?? 10,
    countOptions: _cfg.countOptions ?? [10, 20, 30, "all"],
    startLabel: _cfg.startLabel ?? "クイズを開始",
    onStart: _onStart,
  };

  const el = document.getElementById("start-screen");
  el.innerHTML = "";
  initStartScreen(startConfig);
}

// ── クイズ開始 ────────────────────────────────────────────

async function _onStart(selectedRanges, count) {
  const btn = document.getElementById("qz-start-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "読み込み中...";
  }

  try {
    _allData = await _cfg.fetchData(selectedRanges, count);
  } catch (err) {
    _showError("データ読み込みエラー: " + err.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = _cfg.startLabel ?? "クイズを開始";
    }
    return;
  }

  if (!_allData || _allData.length === 0) {
    _showError("このセクションに問題がありません。別の設定を試してください。");
    if (btn) {
      btn.disabled = false;
      btn.textContent = _cfg.startLabel ?? "クイズを開始";
    }
    return;
  }

  _resetState();
  _quizSet = _allData;

  initProgress({
    total: _quizSet.length,
    lastLabel: "結果を見る",
    resetConfirm: "最初に戻りますか？進捗はリセットされます。",
    onNext: _advanceQuestion,
    onReset: _resetToStart,
  });

  _showScreen("quiz-screen");
  _renderQuestion(0);
}

// ── 問題描画 ──────────────────────────────────────────────

function _renderQuestion(i) {
  hideFeedback();
  updateProgress(i);

  const row = _quizSet[i];
  const qData = _cfg.formatQuestion(row);

  // table モードは question-area を使わない（表全体が問題）
  if (_cfg.answerType !== "table") {
    showQuestion(qData);
  } else {
    // table モードでは question-area を空にしておく
    const qaEl = document.getElementById("qz-question-area");
    if (qaEl) qaEl.innerHTML = "";
  }

  _renderQuestionExtras(row, i);

  document.getElementById("qz-choices").innerHTML = "";
  document.getElementById("qz-text-input").innerHTML = "";
  const tableEl = document.getElementById("qz-table-input");
  if (tableEl) tableEl.innerHTML = "";

  if (_cfg.answerType === "choice") {
    _renderChoices(row, i);
  } else if (_cfg.answerType === "table") {
    _renderTable(row, i);
  } else {
    _renderTextInput(row, i);
  }
}

// ── 4択 ───────────────────────────────────────────────────

function _renderChoices(row, i) {
  const correctLabel = _cfg.formatCorrectLabel(row);

  let options;
  if (row.options) {
    options = row.options;
  } else {
    let distractors;
    if (_cfg.buildDistractors) {
      distractors = _cfg.buildDistractors(row, _allData);
    } else {
      distractors = _shuffle(
        _allData.filter((r) => _cfg.formatCorrectLabel(r) !== correctLabel),
      ).slice(0, 3);
    }
    options = _shuffle([row, ...distractors]).map((r) =>
      _cfg.formatCorrectLabel(r),
    );
  }

  showChoices({
    options,
    correct: correctLabel,
    renderChoice: _cfg.renderChoice ?? null,
    onAnswer({ isCorrect, selected }) {
      if (_cfg.onAnswer) _cfg.onAnswer({ row, isCorrect, selected });

      if (isCorrect) {
        _correctCount++;
      } else {
        _mistakes.push(_buildMistakeItem(row, selected, correctLabel));
      }

      showFeedback({
        isCorrect,
        correctLabel: isCorrect ? null : correctLabel,
        userLabel: isCorrect ? null : selected,
        extraRenderer: _cfg.extraRenderer
          ? (el) => _cfg.extraRenderer(el, row, isCorrect, selected)
          : null,
      });
    },
  });
}

// ── テキスト入力 ──────────────────────────────────────────

function _renderTextInput(row, i) {
  const correctValue = _cfg.getCorrectValue ? _cfg.getCorrectValue(row) : null;
  const correctLabel = _cfg.formatCorrectLabel(row);

  showTextInput({
    label: _cfg.inputLabel ?? "答えを入力",
    placeholder: _cfg.inputPlaceholder ?? "",
    hint: _cfg.inputHint ?? "",
    maxLength: _cfg.inputMaxLength ?? null,
    validate: _cfg.validate
      ? (raw) => _cfg.validate(raw, row)
      : (raw) => {
          const n = parseInt(raw, 10);
          if (isNaN(n)) return { ok: false, message: "数字を入力してください" };
          return { ok: true, value: n, isCorrect: n === correctValue };
        },
    onAnswer({ value, isCorrect }) {
      const userLabel = String(value);
      if (_cfg.onAnswer) _cfg.onAnswer({ row, isCorrect, selected: userLabel });

      if (isCorrect) {
        _correctCount++;
      } else {
        _mistakes.push(_buildMistakeItem(row, userLabel, correctLabel));
      }

      showFeedback({
        isCorrect,
        correctLabel: isCorrect ? null : correctLabel,
        userLabel: isCorrect ? null : userLabel,
        extraRenderer: _cfg.extraRenderer
          ? (el) => _cfg.extraRenderer(el, row, isCorrect, userLabel)
          : null,
      });
    },
  });
}

// ── 表形式入力 ────────────────────────────────────────────

function _renderTable(row, i) {
  const blankKeys = _cfg.getBlankKeys(row);
  const isReviewMode = _cfg._reviewMode ?? false;

  // 正解したかどうかのフラグ（revealで完了した場合はfalse）
  let _completedByCorrect = false;

  showTableInput({
    row,
    tableRows: _cfg.tableRows,
    blankKeys,
    isCorrect: (key, value, r) => _cfg.isCorrect(key, value, r),
    formatCell: (key, r) => _cfg.formatCell(key, r),
    headerKey: _cfg.headerKey ?? "name",
    onComplete(allCorrect) {
      _completedByCorrect = allCorrect;
      if (allCorrect && !isReviewMode) {
        _correctCount++;
      } else if (!allCorrect) {
        // 表示用に mistake を積む（表単位）
        const qData = _cfg.formatQuestion(row);
        _mistakes.push({
          questionText:
            qData.text ?? _cfg.formatCell(_cfg.headerKey ?? "name", row),
          category: qData.category ?? null,
          userAnswer: "（表埋め）",
          correctAnswer: "（表埋め）",
          _rowId: _rowId(row),
          _raw: row,
          _isTable: true,
        });
      }
      window.enableNextButton?.();
    },
  });
}

// ── question extras ───────────────────────────────────────

function _renderQuestionExtras(row, i) {
  const el = document.getElementById("qz-question-extras");
  if (!el) return;

  el.innerHTML = "";

  if (_cfg.renderQuestionExtras) {
    _cfg.renderQuestionExtras(el, row, {
      index: i,
      total: _quizSet.length,
      allData: _allData,
      quizSet: _quizSet,
    });
  }
}

// ── 次の問題 / 結果 ───────────────────────────────────────

function _advanceQuestion(idx) {
  const next = idx + 1;
  if (next < _quizSet.length) {
    _currentIndex = next;
    _renderQuestion(next);
    return;
  }

  _showScreen("result-screen");
  showResult({
    correct: _correctCount,
    total: _quizSet.length,
    mistakes: _mistakes,
    retryLabel: "もう一度挑戦",
    retryMistakesLabel: "間違えた問題だけ",
    renderMistake: _cfg.renderMistake ?? null,
    onRetry: _resetToStart,
    onRetryMistakes(ms) {
      // table モードは _raw から quizSet を再構成
      const ids = new Set(ms.map((m) => m._rowId));
      const retrySet = _allData.filter((r) => ids.has(_rowId(r)));

      if (!retrySet.length) {
        _resetToStart();
        return;
      }

      _resetState();
      _quizSet = retrySet;
      _cfg._reviewMode = true;

      initProgress({
        total: _quizSet.length,
        lastLabel: "結果を見る",
        resetConfirm: "最初に戻りますか？",
        onNext: _advanceQuestion,
        onReset: _resetToStart,
      });

      _showScreen("quiz-screen");
      _renderQuestion(0);
    },
  });
}

// ── リセット ──────────────────────────────────────────────

function _resetToStart() {
  _cfg._reviewMode = false;
  _resetState();
  _showScreen("start-screen");
  _renderStartScreen();
}

function _resetState() {
  _currentIndex = 0;
  _correctCount = 0;
  _mistakes = [];
  _quizSet = [];
}

// ── ヘルパー ──────────────────────────────────────────────

function _showScreen(id) {
  ["start-screen", "quiz-screen", "result-screen"].forEach((s) =>
    document.getElementById(s).classList.add("hidden"),
  );
  document.getElementById(id).classList.remove("hidden");
}

function _showError(msg) {
  document.getElementById("state-msg").textContent = msg;
}

function _rowId(row) {
  return row.id ?? JSON.stringify(row);
}

function _buildMistakeItem(row, userAnswer, correctAnswer) {
  const qData = _cfg.formatQuestion(row);
  return {
    questionText: qData.text ?? "",
    category: qData.category ?? null,
    userAnswer,
    correctAnswer,
    _rowId: _rowId(row),
    _raw: row,
  };
}
