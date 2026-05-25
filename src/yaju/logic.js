// ===================== DOM REFS =====================
const display = document.getElementById("display");
const message = document.getElementById("message");
const loadingBar = document.getElementById("loading-bar");
const terminal = document.getElementById("terminal");

const warningSound = document.getElementById("warning-sound");
const succeedSound = document.getElementById("succeed-sound");
const clickSound = document.getElementById("click-sound");

const swContainer = document.getElementById("specialWarning");
const swImg = document.getElementById("sw-img");
const swTitle = document.getElementById("sw-title");
const swSub = document.getElementById("sw-sub");

const lifeBlocks = document.querySelectorAll(".life-block");
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-timer");
const stopBtn = document.getElementById("stop-timer");
const resetBtn = document.getElementById("reset-timer");

// モバイルサイドバー
const description = document.getElementById("description");
const infoToggle = document.getElementById("info-toggle");
const sidebarClose = document.getElementById("sidebar-close");
const sidebarOverlay = document.getElementById("sidebar-overlay");

// ===================== STATE =====================
let inputCode = "";
let lives = 5;
let wrongCount = 0;
let beastMode = false;
let zeroCount = 0;
let isSubmitting = false;

// ===================== TIMER =====================
let timerInterval = null;
let timeLeft = 300;
let timerRunning = false;

function updateTimerDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
  timerDisplay.classList.toggle("warning", timeLeft <= 30 && timeLeft > 0);
}

function setTimerRunning(running) {
  timerRunning = running;
  startBtn.classList.toggle("running", running);
}

function startTimer() {
  if (timerRunning || timeLeft <= 0) return;
  setTimerRunning(true);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      setTimerRunning(false);
      window.location.href = "fail.html";
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  setTimerRunning(false);
}

function resetTimer() {
  stopTimer();
  timeLeft = 300;
  updateTimerDisplay();
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);

// ===================== LIVES =====================
function updateLives() {
  lifeBlocks.forEach((block, i) => {
    block.classList.toggle("lost", i >= lives);
  });
}

// ===================== DISPLAY =====================
function refreshDisplay() {
  display.textContent = inputCode;
  display.classList.toggle("full", inputCode.length >= 4);
}

function showStatus() {
  if (inputCode.length === 4) {
    message.textContent = inputCode === "1145" ? "まさか…？" : "READY";
    message.className = "";
  } else if (inputCode.length === 6 && inputCode === "114514") {
    message.textContent = "READY";
    message.className = "";
  } else {
    message.textContent = "";
    message.className = "";
  }
}

// ===================== RESET =====================
function resetAll() {
  inputCode = "";
  isSubmitting = false;
  refreshDisplay();
  message.textContent = "";
  message.className = "";
  document.body.classList.remove("warning-bg");
  loadingBar.style.width = "0";
}

// ===================== SHAKE =====================
function shakeTerminal() {
  terminal.classList.remove("shake");
  void terminal.offsetWidth; // reflow
  terminal.classList.add("shake");
  terminal.addEventListener(
    "animationend",
    () => {
      terminal.classList.remove("shake");
    },
    { once: true },
  );
}

// ===================== SPECIAL =====================
function triggerSpecial(sc) {
  swImg.src = sc.img;
  swTitle.textContent = sc.title;
  swSub.textContent = sc.sub;
  swContainer.style.display = "flex";
  new Audio(sc.audio).play().catch(() => {});
  setTimeout(() => {
    swContainer.style.display = "none";
    resetAll();
  }, 6000);
}

// ===================== CHECK PASSWORD =====================
function checkPassword() {
  if (isSubmitting) return;

  if (inputCode === "0000") {
    zeroCount++;
    if (zeroCount >= 3) {
      beastMode = true;
      zeroCount = 0;
      alert("野獣モードが解放された…！");
    }
    resetAll();
    return;
  } else {
    zeroCount = 0;
  }

  if (beastMode && specialCodes[inputCode]) {
    triggerSpecial(specialCodes[inputCode]);
    return;
  }

  if (passwordMap[inputCode]) {
    isSubmitting = true;
    display.classList.add("submitting");
    message.textContent = "ACCESS GRANTED\nLOADING...";
    message.className = "granted";
    loadingBar.style.width = "0";
    void loadingBar.offsetWidth;
    loadingBar.style.width = "100%";
    succeedSound.currentTime = 0;
    succeedSound.play().catch(() => {});
    setTimeout(() => {
      window.location.href = passwordMap[inputCode];
    }, 3000);
    return;
  }

  wrongCount++;
  lives--;
  updateLives();
  shakeTerminal();

  if (lives <= 0) {
    isSubmitting = true;
    message.textContent = "GAME OVER";
    message.className = "denied";
    document.body.classList.add("warning-bg");
    warningSound.currentTime = 0;
    warningSound.play().catch(() => {});
    setTimeout(() => {
      window.location.href = "fail.html";
    }, 2000);
  } else {
    message.textContent = `ACCESS DENIED  (${wrongCount}/5)`;
    message.className = "denied";
    document.body.classList.add("warning-bg");
    warningSound.currentTime = 0;
    warningSound.play().catch(() => {});
    setTimeout(resetAll, 2500);
  }
}

// ===================== INPUT ACTIONS =====================
function handleDigit(d) {
  if (isSubmitting) return;
  const maxLen = inputCode.startsWith("1145") && inputCode.length >= 4 ? 6 : 4;
  if (inputCode.length < maxLen) {
    inputCode += d;
    refreshDisplay();
    showStatus();
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
}

function handleBackspace() {
  if (isSubmitting) return;
  inputCode = inputCode.slice(0, -1);
  refreshDisplay();
  showStatus();
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function handleClear() {
  if (isSubmitting) return;
  resetAll();
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function handleEnter() {
  if (isSubmitting) return;
  if (inputCode.length === 4 || inputCode.length === 6) checkPassword();
}

// ===================== BUTTON CLICKS =====================
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = btn.textContent.trim();
    if (/^\d$/.test(val)) {
      handleDigit(val);
    } else if (val === "←") {
      handleBackspace();
    } else if (val === "C") {
      handleClear();
    } else if (val === "ENTER") {
      handleEnter();
    }
  });
});

// ===================== KEYBOARD =====================
document.addEventListener("keydown", (e) => {
  // Numpad: e.code で明示的に処理（NumLock OFF でも e.code は変わらない）
  if (e.code.startsWith("Numpad")) {
    // Numpad数字 (NumLock ON: e.key = "0"..."9" / OFF: e.key = "ArrowDown" など)
    const numpadDigitMatch = e.code.match(/^Numpad(\d)$/);
    if (numpadDigitMatch) {
      e.preventDefault();
      handleDigit(numpadDigitMatch[1]);
      return;
    }
    // NumpadEnter
    if (e.code === "NumpadEnter") {
      e.preventDefault();
      handleEnter();
      return;
    }
    // NumpadDecimal (.) や NumpadAdd など → 無視
    return;
  }

  // 通常キー
  if (e.key >= "0" && e.key <= "9") {
    handleDigit(e.key);
  } else if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace();
  } else if (e.key.toLowerCase() === "c") {
    handleClear();
  } else if (e.key === "Enter") {
    handleEnter();
  } else if (e.key === " ") {
    // Tab でフォーカスしたボタンを Space で発火
    const focused = document.activeElement;
    if (focused && focused.classList.contains("btn")) {
      e.preventDefault();
      // 視覚フィードバック
      focused.classList.add("btn--pressed");
      setTimeout(() => focused.classList.remove("btn--pressed"), 120);
      focused.click();
    }
  }
});

// ===================== MOBILE SIDEBAR =====================
function openSidebar() {
  description.classList.add("open");
  sidebarOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  description.classList.remove("open");
  sidebarOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

if (infoToggle) infoToggle.addEventListener("click", openSidebar);
if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

// Escape でサイドバーを閉じる（PC では keydown で conflict しないよう確認）
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && description.classList.contains("open")) {
    closeSidebar();
  }
});

// ===================== INIT =====================
updateLives();
updateTimerDisplay();
refreshDisplay();
