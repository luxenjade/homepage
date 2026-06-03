// quiz/config/idiom-quiz.js
// Vintage イディオムクイズ【4択 + 詳細カード + 統計更新】

window.QUIZ_CONFIG = {
  title: "Vintage イディオムクイズ",
  subtitle: "Fill-in-the-blank idiom questions",
  tutorialMd: "../quiz/tutorial/idiom.md",
  backLink: "/miscellaneous/",
  backLabel: "Miscellaneous",
  answerType: "choice",
  supabaseTable: "english_idioms",
  startLabel: "Start Quiz",

  rangeMode: "single",
  rangeLabel: "Quiz Mode",
  ranges: [
    { id: "random", label: "Random Practice | 全問からランダム" },
    { id: "difficult", label: "Focus on Weak Areas | 正答率50%未満" },
    { id: "unattempted", label: "Not Yet Attempted | 取り組み数5未満" },
    {
      id: "mixed",
      label: "Mixed Review | 60% difficult / 30% medium / 10% easy",
    },
  ],
  countMode: "select",
  countDefault: 10,
  countOptions: [5, 10, 20, 30, 50, "all"],

  // 全データキャッシュ（fetchData が初回のみ取得）
  _cache: null,
  _MIN_ATTEMPTS: 5,

  async fetchData(selectedRanges, count) {
    const mode = selectedRanges[0];

    // 初回のみ全件取得
    if (!window.QUIZ_CONFIG._cache) {
      const { data, error } = await window._db
        .from(window.SUPABASE_TABLES.ENGLISH_IDIOMS)
        .select("*");
      if (error) throw new Error(error.message);
      window.QUIZ_CONFIG._cache = data || [];
    }

    const all = window.QUIZ_CONFIG._cache;
    const MIN = window.QUIZ_CONFIG._MIN_ATTEMPTS;

    let filtered;
    switch (mode) {
      case "difficult":
        filtered = all.filter(
          (q) =>
            q.total_attempts >= MIN &&
            (q.correct_rate === null || q.correct_rate < 50),
        );
        break;
      case "unattempted":
        filtered = all.filter(
          (q) => q.total_attempts === null || q.total_attempts < MIN,
        );
        break;
      case "mixed": {
        const difficult = all.filter(
          (q) => q.total_attempts >= MIN && (q.correct_rate ?? 100) < 50,
        );
        const medium = all.filter(
          (q) =>
            q.total_attempts >= MIN &&
            q.correct_rate >= 50 &&
            q.correct_rate < 75,
        );
        const easy = all.filter(
          (q) => q.total_attempts >= MIN && q.correct_rate >= 75,
        );
        const total = parseInt(count) || 10;
        const mixed = [
          ...window._quizShuffle(difficult).slice(0, Math.ceil(total * 0.6)),
          ...window._quizShuffle(medium).slice(0, Math.ceil(total * 0.3)),
          ...window._quizShuffle(easy).slice(0, Math.ceil(total * 0.1)),
        ];
        filtered = mixed.length > 0 ? mixed : all;
        break;
      }
      default:
        filtered = all;
    }

    if (filtered.length === 0) filtered = all;

    const shuffled = window._quizShuffle(filtered);
    if (count === "all") return shuffled;
    return shuffled.slice(0, parseInt(count));
  },

  formatQuestion(row) {
    return {
      text: row.fill_in_the_blanks,
      sub: row.example_jp ?? null,
    };
  },

  formatCorrectLabel(row) {
    return row.idiom_extracted;
  },

  buildDistractors(current, allData) {
    return window
      ._quizShuffle(
        allData.filter((r) => r.idiom_extracted !== current.idiom_extracted),
      )
      .slice(0, 3);
  },

  async onAnswer({ row, isCorrect }) {
    // 統計更新（クイズ進行をブロックしない）
    _updateStats(row.id, isCorrect);
  },

  extraRenderer(el, row, isCorrect) {
    el.innerHTML = _buildFeedbackCard(row, isCorrect);
    _bindReportForm(el, row);
  },

  renderMistake(item) {
    const q = item._raw;
    return `
      <div class="qz-review-item__header">
        <p class="qz-review-item__question">${_esc(item.questionText)}</p>
      </div>
      <div style="font-size:0.85rem;margin:6px 0;color:var(--qz-text-sub);">${q ? _esc(q.example_jp ?? "") : ""}</div>
      <div class="qz-review-item__answers">
        <span class="qz-review-item__user">Your answer: ${_esc(item.userAnswer)}</span>
        <span class="qz-review-item__correct">Correct: <strong>${_esc(item.correctAnswer)}</strong></span>
      </div>
      ${q ? `<div style="font-size:0.8rem;color:var(--qz-text-sub);margin-top:6px;">${_esc(q.idiom)} | ${_esc(q.definition_jp)}</div>` : ""}
    `;
  },

  getCorrectValue: null,
  validate: null,
  renderChoice: null,
};

// ── 統計更新 ──────────────────────────────────────────────

async function _updateStats(id, isCorrect) {
  try {
    const { data, error } = await window._db
      .from(window.SUPABASE_TABLES.ENGLISH_IDIOMS)
      .select("total_attempts, correct_attempts")
      .eq("id", id)
      .single();

    if (error || !data) return;

    const newTotal = (data.total_attempts ?? 0) + 1;
    const newCorrect = (data.correct_attempts ?? 0) + (isCorrect ? 1 : 0);

    await window._db
      .from(window.SUPABASE_TABLES.ENGLISH_IDIOMS)
      .update({
        total_attempts: newTotal,
        correct_attempts: newCorrect,
        correct_rate: (newCorrect / newTotal) * 100,
      })
      .eq("id", id);
  } catch (_) {
    // 統計更新失敗はサイレントに無視
  }
}

// ── フィードバックカード ───────────────────────────────────

function _buildFeedbackCard(row, isCorrect) {
  const headerClass = isCorrect ? "is-correct" : "is-incorrect";
  const headerText = isCorrect ? "✓ Correct!" : "✗ Incorrect";
  const tipsHtml = row.tips
    ? `
      <div class="idiom-field">
        <div class="idiom-field__label">💡 Tips</div>
        <div class="idiom-field__value">${_esc(row.tips)}</div>
      </div>
    `
    : "";

  return `
    <div class="idiom-feedback-card">
      <div class="idiom-feedback-card__header ${headerClass}">${headerText}</div>
      <div class="idiom-feedback-card__body">
        <div class="idiom-field">
          <div class="idiom-field__label">ID</div>
          <div class="idiom-field__value">#${_esc(String(row.id))}</div>
        </div>
        <div class="idiom-field">
          <div class="idiom-field__label">Idiom</div>
          <div class="idiom-field__value is-idiom">${_esc(row.idiom)}</div>
        </div>
        <div class="idiom-field">
          <div class="idiom-field__label">意味 (Meaning)</div>
          <div class="idiom-field__value">${_esc(row.definition_jp)}</div>
        </div>
        <div class="idiom-field">
          <div class="idiom-field__label">Example Sentence</div>
          <div class="idiom-field__value is-example">${_esc(row.example)}</div>
        </div>
        ${tipsHtml}
        <div class="report-section" id="report-${row.id}">
          <div class="report-section__title">⚠️ データに誤りがありますか？</div>
          <button class="report-btn" type="button" data-action="toggle-report" data-id="${row.id}">
            データの誤りを報告
          </button>
          <div class="report-form hidden" id="report-form-${row.id}">
            <select id="report-reason-${row.id}">
              <option value="">-- 理由を選択してください --</option>
              <option value="空欄とイディオムが合っていない">空欄とイディオムが合っていない</option>
              <option value="誤った例文">誤った例文</option>
              <option value="誤った日本語訳">誤った日本語訳</option>
              <option value="誤ったイディオム">誤ったイディオム</option>
              <option value="誤った意味">誤った意味</option>
              <option value="スペルミス">スペルミス</option>
              <option value="その他">その他</option>
            </select>
            <div class="report-form-actions">
              <button class="report-submit-btn" type="button" data-action="submit-report" data-id="${row.id}">送信</button>
              <button class="report-cancel-btn" type="button" data-action="toggle-report" data-id="${row.id}">キャンセル</button>
            </div>
            <div class="report-message" id="report-msg-${row.id}"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function _bindReportForm(el, row) {
  const form = el.querySelector(`#report-form-${row.id}`);
  const reasonEl = el.querySelector(`#report-reason-${row.id}`);
  const msgEl = el.querySelector(`#report-msg-${row.id}`);
  const submitBtn = el.querySelector(
    `[data-action="submit-report"][data-id="${row.id}"]`,
  );
  const toggleButtons = el.querySelectorAll(
    `[data-action="toggle-report"][data-id="${row.id}"]`,
  );

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      form?.classList.toggle("hidden");
    });
  });

  submitBtn?.addEventListener("click", async () => {
    const reason = reasonEl?.value;

    if (!reason) {
      if (msgEl) {
        msgEl.textContent = "理由を選択してください";
        msgEl.className = "report-message is-error";
      }
      return;
    }

    submitBtn.disabled = true;
    if (msgEl) {
      msgEl.textContent = "送信中...";
      msgEl.className = "report-message";
    }

    try {
      const { error } = await window._db
        .from(window.SUPABASE_TABLES.ENGLISH_IDIOMS)
        .update({ corruption_istrue: true, corruption_reason: reason })
        .eq("id", row.id);

      if (error) throw error;

      if (msgEl) {
        msgEl.textContent = "報告ありがとうございました！";
        msgEl.className = "report-message is-success";
      }
      if (reasonEl) reasonEl.disabled = true;
      toggleButtons.forEach((btn) => (btn.disabled = true));
    } catch (_) {
      if (msgEl) {
        msgEl.textContent = "送信に失敗しました。もう一度お試しください。";
        msgEl.className = "report-message is-error";
      }
      submitBtn.disabled = false;
    }
  });
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
