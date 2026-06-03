// quiz.js
// 依存: data.js (africaFull, AFRICA_ISOS, ERA_COLORS, ERA_LABELS, COL_COLORS, COL_LABELS, FLAG_CODE, flagUrl, getColor)
// 外部ライブラリ: D3 v7, topojson-client@3, world-atlas countries-50m.json

// ── STATE ─────────────────────────────────────────────────────────────────────
const state = {
  mode: "name",
  count: 30, // 出題数（デフォルト30）
  queue: [],
  current: 0,
  correct: 0,
  missed: [],
  allMissed: [],
  isReview: false,
  answered: false,
  topoData: null,
  mapReady: false,
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ALL_ISOS = Object.keys(africaFull);

const MODE_DESC = {
  name: "地図上でハイライトされた国の名前を4択から選ぼう。",
  era: "国名と国旗をヒントに、その国の独立年代を4択から選ぼう。",
  colonial: "国名と国旗をヒントに、旧宗主国を8択から選ぼう。",
};

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadLibsAndMap();
  updateStartScreen();
});

// ── MODE ──────────────────────────────────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll("#modeToggle .mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  document.getElementById("startDesc").textContent = MODE_DESC[mode];
}

// ── COUNT ─────────────────────────────────────────────────────────────────────
function setCount(n) {
  state.count = n;
  document.querySelectorAll(".count-btn").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.n) === n);
  });
  updateStartScreen();
}

// ── START / RESTART ───────────────────────────────────────────────────────────
function startQuiz(reviewMode) {
  state.isReview = reviewMode;
  state.correct = 0;
  state.missed = [];
  state.answered = false;

  const pool = reviewMode ? [...state.allMissed] : [...ALL_ISOS];
  const limit = reviewMode ? pool.length : state.count;
  state.queue = shuffle(pool).slice(0, limit);
  state.current = 0;

  showScreen("screenQuiz");

  // display:none が解除されレイアウト確定後に描画
  requestAnimationFrame(() => {
    if (state.topoData) renderQuizMap(state.topoData);
    renderQuestion();
  });
}

// ── QUESTION ──────────────────────────────────────────────────────────────────
function renderQuestion() {
  state.answered = false;
  const iso = state.queue[state.current];
  const d = africaFull[iso];

  updateProgress();
  highlightMap(iso);

  const prompt = document.getElementById("qPrompt");
  if (state.mode === "name") {
    prompt.classList.add("hidden");
  } else {
    prompt.classList.remove("hidden");
    const url = flagUrl(iso);
    document.getElementById("qPromptFlag").innerHTML = url
      ? `<img src="${url}" alt="${d.name}" onerror="this.outerHTML='<span class=\\'flag-emoji\\'>${d.flag}</span>'">`
      : `<span class="flag-emoji">${d.flag}</span>`;
    document.getElementById("qPromptText").innerHTML =
      `<span class="country-name">${d.name}</span> の${state.mode === "era" ? "独立年代" : "旧宗主国"}は？`;
  }

  renderChoices(iso);

  const fb = document.getElementById("qFeedback");
  fb.classList.add("hidden");
  fb.className = "q-feedback hidden";
}

// ── CHOICES ───────────────────────────────────────────────────────────────────
function renderChoices(iso) {
  const box = document.getElementById("qChoices");
  box.innerHTML = "";

  if (state.mode === "name") {
    box.className = "q-choices grid-2x2";
    buildNameOptions(iso).forEach((optIso) => {
      const d = africaFull[optIso];
      const url = flagUrl(optIso);
      const btn = document.createElement("button");
      btn.className = "q-choice";
      btn.dataset.iso = optIso;
      btn.innerHTML = `
        <span class="q-choice-flag">
          ${
            url
              ? `<img src="${url}" alt="${d.name}" onerror="this.outerHTML='<span class=\\'flag-emoji\\'>${d.flag}</span>'">`
              : `<span class="flag-emoji">${d.flag}</span>`
          }
        </span>
        <span>${d.name}</span>`;
      btn.addEventListener("click", () => answerName(iso, optIso, btn));
      box.appendChild(btn);
    });
  } else if (state.mode === "era") {
    box.className = "q-choices grid-col1";
    Object.keys(ERA_LABELS).forEach((era) => {
      const btn = document.createElement("button");
      btn.className = "q-choice";
      btn.dataset.era = era;
      btn.innerHTML = `
        <span class="q-choice-swatch" style="background:${ERA_COLORS[era]}"></span>
        <span>${ERA_LABELS[era]}</span>`;
      btn.addEventListener("click", () => answerEra(iso, era, btn));
      box.appendChild(btn);
    });
  } else {
    box.className = "q-choices grid-2x4";
    Object.keys(COL_LABELS).forEach((col) => {
      const btn = document.createElement("button");
      btn.className = "q-choice";
      btn.dataset.col = col;
      btn.innerHTML = `
        <span class="q-choice-swatch" style="background:${COL_COLORS[col]}"></span>
        <span>${COL_LABELS[col]}</span>`;
      btn.addEventListener("click", () => answerColonial(iso, col, btn));
      box.appendChild(btn);
    });
  }
}

function buildNameOptions(correctIso) {
  const others = shuffle(ALL_ISOS.filter((i) => i !== correctIso)).slice(0, 3);
  return shuffle([correctIso, ...others]);
}

// ── ANSWER HANDLERS ───────────────────────────────────────────────────────────
function answerName(correctIso, chosenIso, btn) {
  if (state.answered) return;
  state.answered = true;
  disableChoices();

  const isCorrect = chosenIso === correctIso;
  if (isCorrect) {
    state.correct++;
    btn.classList.add("correct");
    highlightCorrect(correctIso);
  } else {
    state.missed.push(correctIso);
    btn.classList.add("wrong");
    document.querySelectorAll("#qChoices .q-choice").forEach((b) => {
      if (b.dataset.iso === correctIso) b.classList.add("correct");
    });
    highlightWrong(correctIso);
  }
  showFeedback(isCorrect, correctIso);
}

function answerEra(correctIso, chosenEra, btn) {
  if (state.answered) return;
  state.answered = true;
  disableChoices();

  const correctEra = africaFull[correctIso].era;
  const isCorrect = chosenEra === correctEra;
  if (isCorrect) {
    state.correct++;
    btn.classList.add("correct");
  } else {
    state.missed.push(correctIso);
    btn.classList.add("wrong");
    document.querySelectorAll("#qChoices .q-choice").forEach((b) => {
      if (b.dataset.era === correctEra) b.classList.add("correct");
    });
  }
  showFeedback(isCorrect, correctIso);
}

function answerColonial(correctIso, chosenCol, btn) {
  if (state.answered) return;
  state.answered = true;
  disableChoices();

  const correctCol = africaFull[correctIso].colonial;
  const isCorrect = chosenCol === correctCol;
  if (isCorrect) {
    state.correct++;
    btn.classList.add("correct");
  } else {
    state.missed.push(correctIso);
    btn.classList.add("wrong");
    document.querySelectorAll("#qChoices .q-choice").forEach((b) => {
      if (b.dataset.col === correctCol) b.classList.add("correct");
    });
  }
  showFeedback(isCorrect, correctIso);
}

function disableChoices() {
  document.querySelectorAll("#qChoices .q-choice").forEach((b) => {
    b.disabled = true;
  });
}

// ── FEEDBACK ──────────────────────────────────────────────────────────────────
function showFeedback(isCorrect, iso) {
  const d = africaFull[iso];
  const fb = document.getElementById("qFeedback");
  fb.classList.remove("hidden", "correct", "wrong");
  fb.classList.add(isCorrect ? "correct" : "wrong");

  document.getElementById("feedbackIcon").textContent = isCorrect ? "✓" : "✗";

  let msg = "";
  if (state.mode === "name") {
    msg = isCorrect
      ? `正解！ <strong>${d.name}</strong>（${d.en}）`
      : `不正解。正解は <strong>${d.name}</strong>（${d.en}）`;
  } else if (state.mode === "era") {
    const eraLabel = ERA_LABELS[d.era] || d.era;
    msg = isCorrect
      ? `正解！ 独立年代：<strong>${eraLabel}</strong>`
      : `不正解。正解は <strong>${eraLabel}</strong>（${d.indYear ? d.indYear + "年" : "植民地化されず"}）`;
  } else {
    const colLabel = COL_LABELS[d.colonial] || d.colonial;
    msg = isCorrect
      ? `正解！ 旧宗主国：<strong>${colLabel}</strong>`
      : `不正解。正解は <strong>${colLabel}</strong>`;
  }

  document.getElementById("feedbackText").innerHTML = msg;

  const handler = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      nextQuestion();
      document.removeEventListener("keydown", handler);
    }
  };
  document.addEventListener("keydown", handler);
}

// ── NEXT ──────────────────────────────────────────────────────────────────────
function nextQuestion() {
  state.current++;
  if (state.current >= state.queue.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

// ── FINISH ────────────────────────────────────────────────────────────────────
function finishQuiz() {
  state.allMissed = [...new Set(state.missed)];
  saveMissed();

  const total = state.queue.length;
  const pct = total > 0 ? Math.round((state.correct / total) * 100) : 0;
  const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "😊" : "📚";
  const msg =
    pct >= 80 ? "すばらしい！" : pct >= 60 ? "もう少し！" : "復習しよう";

  document.getElementById("resultEmoji").textContent = emoji;
  document.getElementById("resultMsg").textContent = msg;
  document.getElementById("resultCorrect").textContent = state.correct;
  document.getElementById("resultTotal").textContent = total;
  document.getElementById("resultPct").textContent = `正答率 ${pct}%`;

  buildMissedList();

  const cnt = state.allMissed.length;
  document.getElementById("resultReviewCount").textContent = cnt;
  document.getElementById("retryMissedBtn").disabled = cnt === 0;

  resetMapColors();
  showScreen("screenResult");
  updateStartScreen();
}

function buildMissedList() {
  const sec = document.getElementById("missedSection");
  const list = document.getElementById("missedList");
  list.innerHTML = "";

  if (state.missed.length === 0) {
    sec.style.display = "none";
    return;
  }
  sec.style.display = "";

  state.missed.forEach((iso) => {
    const d = africaFull[iso];
    const url = flagUrl(iso);
    const li = document.createElement("div");
    li.className = "missed-item";
    li.innerHTML = `
      ${
        url
          ? `<img src="${url}" alt="${d.name}" onerror="this.outerHTML='<span class=\\'missed-item-emoji\\'>${d.flag}</span>'">`
          : `<span class="missed-item-emoji">${d.flag}</span>`
      }
      <span class="missed-item-name">${d.name}</span>
      <span class="missed-item-year">${d.indYear ? d.indYear + "年" : "|"}</span>`;
    list.appendChild(li);
  });
}

// ── PROGRESS ──────────────────────────────────────────────────────────────────
function updateProgress() {
  const total = state.queue.length;
  const pct = total > 0 ? (state.current / total) * 100 : 0;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressLabel").textContent =
    `${state.current} / ${total}`;
}

// ── MAP ───────────────────────────────────────────────────────────────────────
function renderQuizMap(topoData) {
  const svg = document.getElementById("qMap");
  const W = svg.clientWidth || svg.parentElement.clientWidth;
  const H = svg.clientHeight || svg.parentElement.clientHeight;
  if (!W || !H) return;

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // scaleを小さめにしてアフリカ全体（北端〜南端）が収まるよう調整
  const projection = d3
    .geoMercator()
    .center([22, 0])
    .scale(Math.min(W, H) * 0.78)
    .translate([W * 0.46, H * 0.52]);

  const pathGen = d3.geoPath().projection(projection);
  const features = topojson.feature(
    topoData,
    topoData.objects.countries,
  ).features;

  features.forEach((feat) => {
    const iso = String(feat.id).padStart(3, "0");
    const isAfrica = AFRICA_ISOS.has(iso);
    const dStr = pathGen(feat);
    if (!dStr) return;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", dStr);
    path.setAttribute("class", isAfrica ? "country" : "country non-africa");
    path.dataset.iso = iso;
    if (isAfrica) path.style.fill = "#b8c4ce";

    svg.appendChild(path);
  });

  state.mapReady = true;
}

function highlightMap(iso) {
  resetMapColors();
  const path = document.querySelector(`#qMap [data-iso="${iso}"]`);
  if (!path) return;
  path.classList.add("q-highlight");
  path.style.fill = "#f0a500";
}

function highlightCorrect(iso) {
  const path = document.querySelector(`#qMap [data-iso="${iso}"]`);
  if (!path) return;
  path.classList.remove("q-highlight");
  path.classList.add("q-correct");
}

function highlightWrong(correctIso) {
  const highlighted = document.querySelector("#qMap .q-highlight");
  if (highlighted) {
    highlighted.classList.remove("q-highlight");
    highlighted.classList.add("q-wrong");
  }
  const correct = document.querySelector(`#qMap [data-iso="${correctIso}"]`);
  if (correct) {
    correct.classList.remove("q-highlight");
    correct.classList.add("q-reveal");
  }
}

function resetMapColors() {
  document.querySelectorAll("#qMap .country").forEach((el) => {
    el.classList.remove("q-highlight", "q-correct", "q-wrong", "q-reveal");
    if (!el.classList.contains("non-africa")) el.style.fill = "#b8c4ce";
  });
}

// ── SCREEN SWITCHING ──────────────────────────────────────────────────────────
function showScreen(id) {
  document
    .querySelectorAll(".quiz-screen")
    .forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ── START SCREEN ──────────────────────────────────────────────────────────────
function updateStartScreen() {
  const cnt = state.allMissed.length;
  document.getElementById("statTotal").textContent = state.count;
  document.getElementById("statMissed").textContent = cnt;
  document.getElementById("reviewCount").textContent = cnt;
  document.getElementById("reviewBtn").disabled = cnt === 0;
}

// ── PERSISTENCE ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "africa-quiz-missed";

function saveMissed() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.allMissed));
  } catch (e) {}
}
function loadMissed() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) state.allMissed = JSON.parse(v);
  } catch (e) {}
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── LIBRARY LOADER ────────────────────────────────────────────────────────────
function loadLibsAndMap() {
  loadMissed();
  updateStartScreen();

  const s1 = document.createElement("script");
  s1.src = "https://d3js.org/d3.v7.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://unpkg.com/topojson-client@3/dist/topojson-client.min.js";
    s2.onload = () => {
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
        .then((r) => r.json())
        .then((data) => {
          state.topoData = data;
          window.addEventListener("resize", () => {
            if (state.topoData) renderQuizMap(state.topoData);
          });
        })
        .catch(() => {
          const el = document.getElementById("qLoading");
          el.innerHTML =
            '<span style="color:#e53">地図データの読み込みに失敗しました</span>';
          el.classList.remove("hidden");
        });
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

//リセット
function resetMissed() {
  if (!confirm("復習リストをリセットしますか？")) return;
  state.allMissed = [];
  saveMissed();
  updateStartScreen();
}
function goToStart() {
  if (!confirm("スタート画面に戻りますか？（進捗はリセットされます）")) return;
  resetMapColors();
  showScreen("screenStart");
}
