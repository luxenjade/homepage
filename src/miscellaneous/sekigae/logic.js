let COLS = 6,
  ROWS = 7;
let seats = [];
let assignment = {};
let isSpinning = false;
let spinTimer = null;

function seatList() {
  return seats.filter((s) => s.on).sort((a, b) => a.r - b.r || a.c - b.c);
}

function initGrid() {
  seats = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) seats.push({ r, c, on: true });
  renderGrid();
}

/* Compute per-row height so ROWS rows fill the grid container exactly */
function rowHeight(gridEl) {
  const gap = 5;
  const h = gridEl.clientHeight;
  return Math.max(20, (h - (ROWS - 1) * gap) / ROWS);
}

function renderGrid() {
  const grid = document.getElementById("seat-grid");
  const rh = rowHeight(grid);
  grid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${ROWS}, ${rh}px)`;
  grid.style.gap = "5px";
  grid.innerHTML = "";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const s = seats.find((x) => x.r === r && x.c === c);
      const div = document.createElement("div");
      if (!s) {
        div.className = "cell empty";
        div.title = "クリックで席を追加";
        div.innerHTML = plusSVG();
        div.onclick = (() => {
          const rr = r,
            cc = c;
          return () => {
            seats.push({ r: rr, c: cc, on: true });
            seats.sort((a, b) => a.r - b.r || a.c - b.c);
            renderGrid();
          };
        })();
      } else if (s.on) {
        div.className = "cell";
        div.title = "クリックで席を削除";
        div.onclick = ((_s) => () => {
          _s.on = false;
          renderGrid();
        })(s);
      } else {
        div.className = "cell empty";
        div.title = "クリックで席を追加";
        div.innerHTML = plusSVG();
        div.onclick = ((_s) => () => {
          _s.on = true;
          renderGrid();
        })(s);
      }
      grid.appendChild(div);
    }
  }

  document.getElementById("seat-count-badge").textContent =
    "席数: " + seatList().length;
  updateSeatWarn();
}

function plusSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:30%;height:30%"><path d="M12 5v14M5 12h14"/></svg>`;
}

function resizeGrid() {
  const nc = Math.max(
    1,
    Math.min(
      12,
      parseInt(document.getElementById("cols-input").value) || 6,
    ),
  );
  const nr = Math.max(
    1,
    Math.min(
      10,
      parseInt(document.getElementById("rows-input").value) || 7,
    ),
  );
  COLS = nc;
  ROWS = nr;
  const existing = seats.filter((s) => s.r < ROWS && s.c < COLS);
  seats = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const ex = existing.find((x) => x.r === r && x.c === c);
      seats.push({ r, c, on: ex ? ex.on : false });
    }
  renderGrid();
}

function clearAll() {
  seats.forEach((s) => (s.on = false));
  renderGrid();
}
function fillAll() {
  seats.forEach((s) => (s.on = true));
  renderGrid();
}

function updateSeatWarn() {
  const sc =
    parseInt(document.getElementById("student-count").value) || 0;
  const sl = seatList();
  const el = document.getElementById("seat-warn");
  if (!el) return;
  if (sc > sl.length) el.textContent = `席数(${sl.length})より多いです`;
  else if (sc < sl.length) el.textContent = `空席 ${sl.length - sc} 席`;
  else el.textContent = "";
}

function renderResultGrid(withSpinner) {
  const grid = document.getElementById("result-grid");
  if (!grid) return;
  const sc =
    parseInt(document.getElementById("student-count").value) || 0;
  const rh = rowHeight(grid);
  grid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${ROWS}, ${rh}px)`;
  grid.style.gap = "5px";
  grid.innerHTML = "";

  const sl = seatList();
  const fs = Math.max(11, Math.min(28, Math.floor(rh * 0.45)));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const s = sl.find((x) => x.r === r && x.c === c);
      const div = document.createElement("div");
      if (!s) {
        div.className = "rcell empty-r";
      } else {
        const val = assignment[r + "_" + c];
        const settled = val != null && !withSpinner;
        div.className = "rcell" + (settled ? " settled" : "");
        div.dataset.key = r + "_" + c;
        const vEl = document.createElement("div");
        vEl.className = "rval";
        vEl.style.fontSize = fs + "px";
        vEl.textContent = val != null ? val : "—";
        div.appendChild(vEl);
      }
      grid.appendChild(div);
    }
  }
}

function startShuffle() {
  if (isSpinning) return;
  const sc =
    parseInt(document.getElementById("student-count").value) || 0;
  const sl = seatList();
  if (sl.length === 0) {
    document.getElementById("shuffle-status").textContent =
      "座席が登録されていません";
    return;
  }
  if (sc < 1) {
    document.getElementById("shuffle-status").textContent =
      "出席者数を入力してください";
    return;
  }

  const useCount = Math.min(sc, sl.length);
  const nums = [];
  for (let i = 1; i <= sc; i++) nums.push(i);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  const finalAssign = {};
  sl.forEach((s, i) => {
    finalAssign[s.r + "_" + s.c] = i < useCount ? nums[i] : null;
  });

  isSpinning = true;
  assignment = {};
  document.getElementById("shuffle-btn").disabled = true;
  document.getElementById("shuffle-status").textContent =
    "シャッフル中...";
  renderResultGrid(true);

  const totalDuration = 3200,
    startInt = 45,
    endInt = 380;
  let elapsed = 0;
  function getInt(t) {
    const p = Math.min(t / totalDuration, 1);
    return Math.round(startInt + (endInt - startInt) * p * p);
  }

  function tick() {
    document.querySelectorAll(".rcell[data-key]").forEach((cell) => {
      const vEl = cell.querySelector(".rval");
      if (vEl) vEl.textContent = Math.ceil(Math.random() * sc);
    });
    const interval = getInt(elapsed);
    elapsed += interval;
    if (elapsed >= totalDuration) {
      Object.assign(assignment, finalAssign);
      isSpinning = false;
      document.getElementById("shuffle-btn").disabled = false;
      renderResultGrid(false);
      document.getElementById("shuffle-status").textContent =
        useCount + "名の席が決まりました";
      launchConfetti();
      return;
    }
    spinTimer = setTimeout(tick, interval);
  }
  tick();
}

function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#ec4899",
  ];
  const pieces = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 300,
    w: 5 + Math.random() * 8,
    h: 8 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 5,
    vy: 1.5 + Math.random() * 4,
    rot: Math.random() * 360,
    vrot: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));
  const start = performance.now(),
    duration = 4000;
  (function draw(now) {
    const t = now - start,
      p = t / duration;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach((q) => {
      q.x += q.vx;
      q.y += q.vy;
      q.vy += 0.06;
      q.rot += q.vrot;
      if (p > 0.55) q.opacity = Math.max(0, 1 - (p - 0.55) / 0.45);
      if (q.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.globalAlpha = q.opacity;
      ctx.translate(q.x, q.y);
      ctx.rotate((q.rot * Math.PI) / 180);
      ctx.fillStyle = q.color;
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      ctx.restore();
    });
    if (t < duration && alive) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })(start);
}

function switchTab(i) {
  [0, 1].forEach((ti) => {
    document
      .getElementById("tab-" + ti)
      .classList.toggle("active", ti === i);
    const sec = document.getElementById("section-" + ti);
    sec.classList.toggle("active", ti === i);
  });
  if (i === 1) {
    updateSeatWarn();
    renderResultGrid(false);
  }
  if (i === 0) {
    renderGrid();
  }
}

window.addEventListener("resize", () => {
  const active = document.querySelector(".section.active");
  if (!active) return;
  if (active.id === "section-0") renderGrid();
  else renderResultGrid(false);
});

document
  .getElementById("student-count")
  .addEventListener("input", updateSeatWarn);

initGrid();