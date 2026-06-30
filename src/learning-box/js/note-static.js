// Static note pages — no marked.js or runtime markdown fetch.

let UNITS = [];
let currentUnitIdx = 0;
let currentTab = "summary";

function readUnitsData() {
  const el = document.getElementById("noteUnitsData");
  if (!el) return [];
  return JSON.parse(el.textContent);
}

function initApp() {
  UNITS = readUnitsData();
  if (!UNITS.length) return;

  bindNavControls();
  bindKeyboard();

  const initialIdx = hashToUnitIndex(location.hash);
  navigateTo(initialIdx >= 0 ? initialIdx : 0, { updateHash: false });

  window.addEventListener("hashchange", () => {
    const idx = hashToUnitIndex(location.hash);
    if (idx >= 0 && idx !== currentUnitIdx) navigateTo(idx, { updateHash: false });
  });
}

function hashToUnitIndex(hash) {
  const id = (hash || "").replace(/^#/, "");
  if (!id) return -1;
  return UNITS.findIndex((unit) => unit.id === id);
}

// Must match the @media (max-width: ...) breakpoint in note-style.css
// where the sidebar is hidden off-screen and the nav-toggle is shown.
const MOBILE_NAV_BREAKPOINT_PX = 900;

function isMobileNav() {
  return window.innerWidth <= MOBILE_NAV_BREAKPOINT_PX;
}

function bindNavControls() {
  const trigger = document.getElementById("unitDropdownTrigger");
  const overlay = document.getElementById("navOverlay");
  const sidebar = document.getElementById("unitNav");

  // Backward-compat: if the older floating toggle still exists, wire it up.
  const legacyToggle = document.getElementById("navToggle");

  const setOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    if (trigger) {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
  };

  if (trigger) {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = !document.body.classList.contains("nav-open");
      setOpen(willOpen);
    });
  }
  if (legacyToggle) {
    legacyToggle.addEventListener("click", () => {
      setOpen(!document.body.classList.contains("nav-open"));
    });
  }
  if (overlay) {
    overlay.addEventListener("click", () => setOpen(false));
  }

  // Close dropdown when a unit is selected on mobile.
  if (sidebar) {
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest(".nav-unit-btn") && isMobileNav()) {
        setOpen(false);
      }
    });
  }

  // Click outside the trigger / sidebar closes the dropdown on mobile.
  document.addEventListener("click", (event) => {
    if (!isMobileNav()) return;
    if (!document.body.classList.contains("nav-open")) return;
    if (trigger && trigger.contains(event.target)) return;
    if (sidebar && sidebar.contains(event.target)) return;
    setOpen(false);
  });

  // Keep nav-open state consistent with the responsive breakpoint:
  // if the viewport grows past the breakpoint while the menu is open,
  // the sidebar is rendered in its normal position, so reset the class
  // to avoid an inconsistent state on the next resize.
  window.addEventListener("resize", () => {
    if (!isMobileNav()) {
      setOpen(false);
    }
  });
}

function bindKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      return;
    }
    if (event.key === "ArrowRight" || event.key === "l") {
      navigateTo(currentUnitIdx + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "h") {
      navigateTo(currentUnitIdx - 1);
    }
    if (event.key === "s") switchTab("summary");
    if (event.key === "q") switchTab("quiz");
    if (event.key === "Escape") {
      document.body.classList.remove("nav-open");
      const trigger = document.getElementById("unitDropdownTrigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    }
  });
}

function navTo(idx) {
  navigateTo(idx);
}

function navigateTo(idx, { updateHash = true } = {}) {
  if (idx < 0 || idx >= UNITS.length) return;

  currentUnitIdx = idx;
  const unit = UNITS[idx];

  document.querySelectorAll(".nav-unit-btn").forEach((button) => {
    button.classList.toggle("active", button.id === `nav-${unit.id}`);
  });

  document.querySelectorAll(".unit-panel").forEach((panel) => {
    panel.style.display = panel.dataset.unitId === unit.id ? "block" : "none";
  });

  const headerSubEl = document.getElementById("headerSub");
  if (headerSubEl) headerSubEl.textContent = `Unit ${unit.num}`;

  const headerUnitNumEl = document.getElementById("headerUnitNum");
  if (headerUnitNumEl) headerUnitNumEl.textContent = `Unit ${unit.num}`;

  const progress = document.getElementById(`unitProgress-${unit.id}`);
  if (progress) {
    progress.textContent =
      unit.clozeCount > 0 ? `穴埋め ${unit.clozeCount}語` : "";
  }

  if (updateHash) {
    const nextHash = `#${unit.id}`;
    if (location.hash !== nextHash) {
      history.replaceState(null, "", nextHash);
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  showCurrentTab();
}

function switchTab(tab) {
  currentTab = tab;
  document
    .getElementById("tabSummary")
    .classList.toggle("active", tab === "summary");
  document.getElementById("tabQuiz").classList.toggle("active", tab === "quiz");
  showCurrentTab();
}

function showCurrentTab() {
  const unit = UNITS[currentUnitIdx];
  const summaryPanel = document.getElementById(`panelSummary-${unit.id}`);
  const quizPanel = document.getElementById(`panelQuiz-${unit.id}`);
  const quizChrome = document.getElementById("quizChrome");

  summaryPanel.style.display = currentTab === "summary" ? "block" : "none";
  quizPanel.style.display = currentTab === "quiz" ? "block" : "none";
  if (quizChrome) {
    quizChrome.style.display = currentTab === "quiz" ? "block" : "none";
  }

  if (currentTab === "quiz") updateClozeCount(unit.id);
}

function toggleCloze(element) {
  element.classList.toggle("cloze-hidden");
  element.classList.toggle("revealed");
  updateClozeCount(element.closest(".unit-panel").dataset.unitId);
}

function revealAll() {
  const unit = UNITS[currentUnitIdx];
  document
    .querySelectorAll(`#panelQuiz-${unit.id} .cloze-word`)
    .forEach((element) => {
      element.classList.remove("cloze-hidden");
      element.classList.add("revealed");
    });
  updateClozeCount(unit.id);
}

function hideAll() {
  const unit = UNITS[currentUnitIdx];
  document
    .querySelectorAll(`#panelQuiz-${unit.id} .cloze-word`)
    .forEach((element) => {
      element.classList.add("cloze-hidden");
      element.classList.remove("revealed");
    });
  updateClozeCount(unit.id);
}

function resetQuiz() {
  hideAll();
  showToast("リセットしました");
}

function updateClozeCount(unitId) {
  const all = document.querySelectorAll(`#panelQuiz-${unitId} .cloze-word`);
  const revealed = document.querySelectorAll(
    `#panelQuiz-${unitId} .cloze-word.revealed`,
  );
  const total = all.length;
  const done = revealed.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("quizProgressFill").style.width = `${pct}%`;
  document.getElementById("quizScoreBig").textContent = `${done} / ${total}`;

  const dot = document.getElementById(`navdot-${unitId}`);
  if (dot) dot.classList.toggle("done", total > 0 && done === total);
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

initApp();
