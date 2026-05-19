// ============================================================
//  wh-admin — supabase_config.js から DB を取得
// ============================================================

const TABLE = "wh_dates";
const PAGE_SIZE = 50;

// supabase_config.js は ESM module なので動的インポート
let db;
(async () => {
  const { db: _db } = await import("/js/supabase_config.js");
  db = _db;
  initAuth();
})();

// ── DOM refs ──────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const loginEmailEl = document.getElementById("login-email");
const loginPassEl = document.getElementById("login-pass");
const loginBtn = document.getElementById("login-btn");
const loginErrEl = document.getElementById("login-err");
const logoutBtn = document.getElementById("logout-btn");
const userBadge = document.getElementById("user-email-badge");

const tableBody = document.getElementById("table-body");
const paginationEl = document.getElementById("pagination");
const countBadge = document.getElementById("count-badge");
const searchInput = document.getElementById("search-input");
const filterRegion = document.getElementById("filter-region");
const filterField = document.getElementById("filter-field");
const filterRecord = document.getElementById("filter-record");
const newRowBtn = document.getElementById("new-row-btn");

const editModal = document.getElementById("edit-modal");
const modalTitle = document.getElementById("modal-title");
const modalClose = document.getElementById("modal-close");
const modalCancel = document.getElementById("modal-cancel");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const saveMsgEl = document.getElementById("modal-save-msg");
const stepIndicator = document.getElementById("step-indicator");
const stepNextBtn = document.getElementById("step-next-btn");
const stepBackBtn = document.getElementById("step-back-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmMsg = document.getElementById("confirm-msg");
const confirmClose = document.getElementById("confirm-close");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmOk = document.getElementById("confirm-ok");

// Form fields
const fYear = document.getElementById("f-year");
const fYearEnd = document.getElementById("f-year-end");
const fDateType = document.getElementById("f-date-type");
const fRecordType = document.getElementById("f-record-type");
const fFullDate = document.getElementById("f-full-date");
const fField = document.getElementById("f-field");
const fEvent = document.getElementById("f-event");
const fDesc = document.getElementById("f-description");
const fWikiUrl = document.getElementById("f-wiki-url");
const fullDateRow = document.getElementById("full-date-row");
const regionGrid = document.getElementById("region-grid");
const wikiSearchBtn = document.getElementById("wiki-search-btn");
const wikiStatus = document.getElementById("wiki-status");

const memoSearchEl = document.getElementById("memo-search");
const memoListEl = document.getElementById("memo-list");
const memoEditorEl = document.getElementById("memo-editor");
const memoCountEl = document.getElementById("memo-count-badge");

// ── State ─────────────────────────────────────────────────────
let allRows = [];
let filtered = [];
let currentPage = 1;
let editingId = null;
let sortCol = "year";
let sortAsc = true;
let memoRows = [];
let memoFiltered = [];
let selectedMemoId = null;
let allRegions = []; // [{key, label}]
let currentStep = 1;
const TOTAL_STEPS = 3;

const STEP_LABELS = ["基本情報", "地域", "Wikipedia"];

// ── Auth ──────────────────────────────────────────────────────
async function initAuth() {
  const {
    data: { session },
  } = await db.auth.getSession();
  if (session) showAdmin(session.user.email);

  db.auth.onAuthStateChange((_event, session) => {
    if (session) showAdmin(session.user.email);
    else showLogin();
  });
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  adminScreen.classList.add("hidden");
}

function showAdmin(email) {
  loginScreen.classList.add("hidden");
  adminScreen.classList.remove("hidden");
  userBadge.textContent = email || "";
  loadRegions();
  loadTable();
  loadMemoRows();
}

loginBtn.addEventListener("click", async () => {
  loginErrEl.textContent = "";
  loginBtn.disabled = true;
  loginBtn.textContent = "ログイン中…";
  const { error } = await db.auth.signInWithPassword({
    email: loginEmailEl.value.trim(),
    password: loginPassEl.value,
  });
  if (error) {
    loginErrEl.textContent = error.message;
    loginBtn.disabled = false;
    loginBtn.textContent = "ログイン";
  }
});
loginPassEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});
logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();
});

// ── Regions ───────────────────────────────────────────────────
async function loadRegions() {
  const { data } = await db
    .from("wh_regions")
    .select("key, label")
    .order("sort");
  if (!data) return;
  allRegions = data;

  // Populate filter dropdown
  filterRegion.innerHTML = '<option value="">地域：すべて</option>';
  allRegions.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.key;
    opt.textContent = r.label;
    filterRegion.appendChild(opt);
  });

  // Build region chip grid in modal
  buildRegionGrid([]);
}

function buildRegionGrid(selected) {
  regionGrid.innerHTML = allRegions
    .map(
      (r) => `
          <label class="region-chip ${selected.includes(r.key) ? "checked" : ""}" data-key="${r.key}">
            <input type="checkbox" value="${r.key}" ${selected.includes(r.key) ? "checked" : ""} />
            ${escHtml(r.label)}
          </label>
        `,
    )
    .join("");

  regionGrid.querySelectorAll(".region-chip").forEach((chip) => {
    chip.addEventListener("change", () => {
      chip.classList.toggle("checked", chip.querySelector("input").checked);
    });
    // clicking the label itself
    chip.querySelector("input").addEventListener("change", (e) => {
      chip.classList.toggle("checked", e.target.checked);
    });
  });
}

function getSelectedRegions() {
  return [...regionGrid.querySelectorAll("input[type=checkbox]:checked")].map(
    (cb) => cb.value,
  );
}

// ── Table load & filter ───────────────────────────────────────
async function loadTable() {
  tableBody.innerHTML =
    '<tr class="loading-row"><td colspan="7"><span class="spinner"></span> 読み込み中…</td></tr>';
  const { data, error } = await db
    .from(TABLE)
    .select(
      "id, year, year_end, date_type, record_type, event, field, region, wiki_score, memo, description, full_date, wiki_url",
    )
    .order("year", { ascending: true, nullsFirst: false });

  if (error) {
    tableBody.innerHTML = `<tr class="loading-row"><td colspan="7" style="color:#e74c3c;">エラー: ${escHtml(error.message)}</td></tr>`;
    return;
  }
  allRows = data || [];
  applyFilters();
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const region = filterRegion.value;
  const field = filterField.value;
  const recType = filterRecord.value;

  filtered = allRows.filter((row) => {
    if (
      q &&
      !row.event?.toLowerCase().includes(q) &&
      !row.description?.toLowerCase().includes(q)
    )
      return false;
    if (region && !(row.region || []).includes(region)) return false;
    if (field && row.field !== field) return false;
    if (recType && row.record_type !== recType) return false;
    return true;
  });

  filtered.sort((a, b) => {
    let av = a[sortCol],
      bv = b[sortCol];
    if (av === null || av === undefined) av = sortAsc ? Infinity : -Infinity;
    if (bv === null || bv === undefined) bv = sortAsc ? Infinity : -Infinity;
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  currentPage = 1;
  renderTable();
  renderPagination();
  countBadge.textContent = `${filtered.length} 件`;
  updateSortIcons();
}

function updateSortIcons() {
  ["year", "record_type", "event", "field", "wiki_score"].forEach((col) => {
    const el = document.getElementById("sort-" + col);
    if (!el) return;
    if (col === sortCol) el.textContent = sortAsc ? "↑" : "↓";
    else el.textContent = "";
  });
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filtered.slice(start, start + PAGE_SIZE);

  if (page.length === 0) {
    tableBody.innerHTML =
      '<tr class="loading-row"><td colspan="7" style="color:var(--color-text-secondary);">データなし</td></tr>';
    return;
  }

  tableBody.innerHTML = page
    .map((row) => {
      const yearStr = formatYear(row.year, row.year_end);
      const recTag = `<span class="tag tag-record-${row.record_type}">${escHtml(row.record_type)}</span>`;
      const regionStr = (row.region || [])
        .map((k) => allRegions.find((r) => r.key === k)?.label || k)
        .slice(0, 2)
        .join(", ");
      const hasMemo = row.memo
        ? '<span class="has-memo" title="メモあり">●</span>'
        : "";

      return `<tr data-id="${row.id}">
            <td class="cell-year">${escHtml(yearStr)}</td>
            <td>${recTag}</td>
            <td>${escHtml(row.event || "")}</td>
            <td><span class="tag">${escHtml(row.field || "—")}</span></td>
            <td>${escHtml(regionStr)}</td>
            <td style="text-align:center;">${row.wiki_score || "—"}</td>
            <td style="text-align:center;">${hasMemo}</td>
          </tr>`;
    })
    .join("");

  tableBody.querySelectorAll("tr[data-id]").forEach((tr) => {
    tr.addEventListener("click", () => openEditModal(Number(tr.dataset.id)));
  });
}

function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  if (total <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let html = `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} data-p="${currentPage - 1}">‹</button>`;
  for (let p = 1; p <= total; p++) {
    if (total > 10 && Math.abs(p - currentPage) > 3 && p !== 1 && p !== total) {
      if (p === 2 || p === total - 1)
        html += `<span style="padding:0 4px;color:var(--color-text-secondary)">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${p === currentPage ? "active" : ""}" data-p="${p}">${p}</button>`;
  }
  html += `<button class="page-btn" ${currentPage === total ? "disabled" : ""} data-p="${currentPage + 1}">›</button>`;
  paginationEl.innerHTML = html;
  paginationEl.querySelectorAll(".page-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.p);
      renderTable();
      renderPagination();
    });
  });
}

// ── Sort ──────────────────────────────────────────────────────
document.querySelectorAll("thead th[data-col]").forEach((th) => {
  th.addEventListener("click", () => {
    const col = th.dataset.col;
    if (sortCol === col) sortAsc = !sortAsc;
    else {
      sortCol = col;
      sortAsc = true;
    }
    applyFilters();
  });
});

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 250);
});
filterRegion.addEventListener("change", applyFilters);
filterField.addEventListener("change", applyFilters);
filterRecord.addEventListener("change", applyFilters);

// ── Multi-step modal ──────────────────────────────────────────
function renderStepIndicator() {
  stepIndicator.innerHTML = STEP_LABELS.map((label, i) => {
    const n = i + 1;
    const cls = n < currentStep ? "done" : n === currentStep ? "active" : "";
    const wrapCls = n === currentStep ? "active" : "";
    return `
            ${i > 0 ? `<div class="step-line ${n <= currentStep ? "done" : ""}"></div>` : ""}
            <div class="step-label-wrap ${wrapCls}">
              <div class="step-dot ${cls}">${n < currentStep ? "✓" : n}</div>
              <div class="step-label">${label}</div>
            </div>
          `;
  }).join("");
}

function goToStep(n) {
  currentStep = n;
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    document.getElementById("step-" + i).classList.toggle("active", i === n);
  }
  // Footer buttons
  stepBackBtn.classList.toggle("hidden", n === 1);
  modalCancel.classList.toggle("hidden", n !== 1);
  stepNextBtn.classList.toggle("hidden", n === TOTAL_STEPS);
  saveBtn.classList.toggle("hidden", n !== TOTAL_STEPS);

  renderStepIndicator();

  // Auto-search wiki when arriving at step 3 and URL is empty
  if (n === TOTAL_STEPS && !fWikiUrl.value.trim() && fEvent.value.trim()) {
    searchWikiUrl(fEvent.value.trim());
  }
}

function openEditModal(id) {
  const row = allRows.find((r) => r.id === id);
  if (!row) return;
  editingId = id;
  modalTitle.textContent = `編集 #${id}`;
  deleteBtn.style.display = "inline-flex";
  populateForm(row);
  goToStep(1);
  editModal.classList.add("open");
  saveMsgEl.textContent = "";
  saveMsgEl.className = "save-msg";
  wikiStatus.textContent = "";
  wikiStatus.className = "wiki-status";
}

function openNewModal() {
  editingId = null;
  modalTitle.textContent = "新規レコード追加";
  deleteBtn.style.display = "none";
  populateForm({});
  goToStep(1);
  editModal.classList.add("open");
  saveMsgEl.textContent = "";
  saveMsgEl.className = "save-msg";
  wikiStatus.textContent = "";
  wikiStatus.className = "wiki-status";
}

function populateForm(row) {
  fYear.value = row.year ?? "";
  fYearEnd.value = row.year_end ?? "";
  fDateType.value = row.date_type || "year";
  fRecordType.value = row.record_type || "event";
  fFullDate.value = row.full_date || "";
  fField.value = row.field || "";
  fEvent.value = row.event || "";
  fDesc.value = row.description || "";
  fWikiUrl.value = row.wiki_url || "";
  updateFullDateVisibility();
  buildRegionGrid(row.region || []);
}

fDateType.addEventListener("change", updateFullDateVisibility);
function updateFullDateVisibility() {
  if (fDateType.value === "full") fullDateRow.classList.remove("hidden");
  else fullDateRow.classList.add("hidden");
}

// Step next / back
stepNextBtn.addEventListener("click", () => {
  if (currentStep === 1) {
    if (!fEvent.value.trim()) {
      alert("イベント名を入力してください");
      fEvent.focus();
      return;
    }
  }
  if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
});

stepBackBtn.addEventListener("click", () => {
  if (currentStep > 1) goToStep(currentStep - 1);
});

// ── Wikipedia auto-search ──────────────────────────────────────
wikiSearchBtn.addEventListener("click", () => {
  const q = fEvent.value.trim();
  if (!q) {
    wikiStatus.textContent = "イベント名を入力してください";
    wikiStatus.className = "wiki-status error";
    return;
  }
  searchWikiUrl(q);
});

async function searchWikiUrl(query) {
  wikiStatus.textContent = "検索中…";
  wikiStatus.className = "wiki-status";
  wikiSearchBtn.disabled = true;

  try {
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: 1,
      format: "json",
      origin: "*",
    });
    const res = await fetch(`https://ja.wikipedia.org/w/api.php?${params}`);
    const data = await res.json();
    const hit = data?.query?.search?.[0];

    if (hit) {
      const title = hit.title;
      const url = `https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}`;
      fWikiUrl.value = url;
      wikiStatus.textContent = `✓ 「${title}」が見つかりました。必要に応じて修正してください。`;
      wikiStatus.className = "wiki-status found";
    } else {
      wikiStatus.textContent = "該当なし — URLを手動で入力してください。";
      wikiStatus.className = "wiki-status not-found";
    }
  } catch (e) {
    wikiStatus.textContent = "検索エラー: " + e.message;
    wikiStatus.className = "wiki-status error";
  } finally {
    wikiSearchBtn.disabled = false;
  }
}

// ── Build payload & save ───────────────────────────────────────
function buildPayload() {
  return {
    year: fYear.value !== "" ? parseInt(fYear.value) : null,
    year_end: fYearEnd.value !== "" ? parseInt(fYearEnd.value) : null,
    date_type: fDateType.value,
    record_type: fRecordType.value,
    full_date:
      fDateType.value === "full" && fFullDate.value ? fFullDate.value : null,
    field: fField.value || null,
    event: fEvent.value.trim(),
    description: fDesc.value.trim() || null,
    region: getSelectedRegions(),
    wiki_url: fWikiUrl.value.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

saveBtn.addEventListener("click", async () => {
  saveMsgEl.className = "save-msg";
  saveMsgEl.textContent = "";

  const payload = buildPayload();
  if (!payload.event) {
    showSaveMsg("イベント名は必須です", true);
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "保存中…";

  let error;
  if (editingId) {
    ({ error } = await db.from(TABLE).update(payload).eq("id", editingId));
  } else {
    const insert = { ...payload };
    delete insert.updated_at;
    ({ error } = await db.from(TABLE).insert(insert));
  }

  saveBtn.disabled = false;
  saveBtn.textContent = "保存";

  if (error) {
    showSaveMsg("保存失敗: " + error.message, true);
    return;
  }
  showSaveMsg("保存しました", false);
  await loadTable();
  await loadMemoRows();
  setTimeout(() => editModal.classList.remove("open"), 800);
});

function showSaveMsg(msg, isErr) {
  saveMsgEl.textContent = msg;
  saveMsgEl.className = "save-msg " + (isErr ? "err" : "ok");
}

// ── Delete ────────────────────────────────────────────────────
deleteBtn.addEventListener("click", () => {
  const row = allRows.find((r) => r.id === editingId);
  confirmMsg.textContent = `「${row?.event || ""}」(ID: ${editingId}) を削除しますか？この操作は取り消せません。`;
  confirmModal.classList.add("open");
});

confirmOk.addEventListener("click", async () => {
  const { error } = await db.from(TABLE).delete().eq("id", editingId);
  if (error) {
    alert("削除失敗: " + error.message);
    return;
  }
  confirmModal.classList.remove("open");
  editModal.classList.remove("open");
  await loadTable();
  await loadMemoRows();
});

// ── Modal close ───────────────────────────────────────────────
[modalClose, modalCancel].forEach((el) =>
  el.addEventListener("click", () => editModal.classList.remove("open")),
);
[confirmClose, confirmCancel].forEach((el) =>
  el.addEventListener("click", () => confirmModal.classList.remove("open")),
);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) editModal.classList.remove("open");
});
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) confirmModal.classList.remove("open");
});

newRowBtn.addEventListener("click", openNewModal);

// ── Tabs ──────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ── Memo tab ──────────────────────────────────────────────────
async function loadMemoRows() {
  const { data, error } = await db
    .from(TABLE)
    .select("id, year, year_end, event, memo")
    .not("memo", "is", null)
    .order("year", { ascending: true });

  if (error) {
    memoListEl.innerHTML = `<div style="padding:1rem;color:#e74c3c;">エラー: ${escHtml(error.message)}</div>`;
    return;
  }
  memoRows = data || [];
  filterMemoList();
}

function filterMemoList() {
  const q = memoSearchEl.value.trim().toLowerCase();
  memoFiltered = q
    ? memoRows.filter(
        (r) =>
          r.event?.toLowerCase().includes(q) ||
          r.memo?.toLowerCase().includes(q),
      )
    : [...memoRows];
  memoCountEl.textContent = `${memoFiltered.length} 件`;
  renderMemoList();
}

function renderMemoList() {
  if (memoFiltered.length === 0) {
    memoListEl.innerHTML =
      '<div style="padding:1rem;text-align:center;color:var(--color-text-secondary);font-size:0.875rem;">データなし</div>';
    return;
  }
  memoListEl.innerHTML = memoFiltered
    .map(
      (r) => `
          <div class="memo-item ${r.id === selectedMemoId ? "selected" : ""}" data-id="${r.id}">
            <div class="memo-item__year">${escHtml(formatYear(r.year, r.year_end))}</div>
            <div class="memo-item__event">${escHtml(r.event || "")}</div>
          </div>
        `,
    )
    .join("");
  memoListEl.querySelectorAll(".memo-item").forEach((el) => {
    el.addEventListener("click", () => openMemoEditor(Number(el.dataset.id)));
  });
}

let memoSaveTimer;

function openMemoEditor(id) {
  selectedMemoId = id;
  renderMemoList();
  const row =
    memoFiltered.find((r) => r.id === id) || allRows.find((r) => r.id === id);
  if (!row) return;
  const yearStr = formatYear(row.year, row.year_end);

  memoEditorEl.innerHTML = `
          <div class="memo-editor__header">メモ編集</div>
          <div class="memo-editor__title">${escHtml(yearStr)} ｜ ${escHtml(row.event || "")}</div>
          <div class="memo-tabs">
            <button class="memo-tab-btn active" data-view="edit">編集</button>
            <button class="memo-tab-btn" data-view="preview">プレビュー</button>
          </div>
          <textarea id="memo-textarea" rows="12" placeholder="Markdown で入力…" style="width:100%;">${escHtml(row.memo || "")}</textarea>
          <div id="memo-preview" class="memo-preview hidden"></div>
          <div id="memo-save-msg" class="save-msg" style="margin-top:0.5rem;"></div>
          <div style="display:flex;gap:0.6rem;margin-top:0.75rem;">
            <button class="btn-accent" id="memo-save-btn">保存</button>
            <button class="btn-secondary" id="memo-clear-btn">メモを削除</button>
          </div>
        `;

  const textarea = document.getElementById("memo-textarea");
  const previewDiv = document.getElementById("memo-preview");
  const memoSaveMsg = document.getElementById("memo-save-msg");
  const memoSaveBtn = document.getElementById("memo-save-btn");
  const memoClearBtn = document.getElementById("memo-clear-btn");

  memoEditorEl.querySelectorAll(".memo-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      memoEditorEl
        .querySelectorAll(".memo-tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (btn.dataset.view === "preview") {
        previewDiv.innerHTML = marked.parse(textarea.value || "");
        previewDiv.classList.remove("hidden");
        textarea.classList.add("hidden");
      } else {
        previewDiv.classList.add("hidden");
        textarea.classList.remove("hidden");
      }
    });
  });

  textarea.addEventListener("input", () => {
    clearTimeout(memoSaveTimer);
    memoSaveMsg.textContent = "";
    memoSaveTimer = setTimeout(
      () => saveMemo(id, textarea.value, memoSaveMsg),
      1500,
    );
  });

  memoSaveBtn.addEventListener("click", () => {
    clearTimeout(memoSaveTimer);
    saveMemo(id, textarea.value, memoSaveMsg);
  });

  memoClearBtn.addEventListener("click", async () => {
    if (!confirm("このレコードのメモを削除しますか？")) return;
    await saveMemo(id, null, memoSaveMsg, true);
    openMemoEditor(id);
    await loadMemoRows();
  });
}

async function saveMemo(id, value, msgEl, isClear = false) {
  const { error } = await db
    .from(TABLE)
    .update({ memo: value || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    if (msgEl) {
      msgEl.textContent = "保存失敗: " + error.message;
      msgEl.className = "save-msg err";
    }
    return;
  }
  if (msgEl) {
    msgEl.textContent = isClear ? "メモを削除しました" : "保存しました";
    msgEl.className = "save-msg ok";
  }
  const ri = allRows.findIndex((r) => r.id === id);
  if (ri >= 0) allRows[ri].memo = value || null;
  const mi = memoRows.findIndex((r) => r.id === id);
  if (mi >= 0) memoRows[mi].memo = value || null;
  if (isClear) {
    memoRows = memoRows.filter((r) => r.id !== id);
    filterMemoList();
  }
}

let memoSearchTimer;
memoSearchEl.addEventListener("input", () => {
  clearTimeout(memoSearchTimer);
  memoSearchTimer = setTimeout(filterMemoList, 250);
});

// ── Helpers ───────────────────────────────────────────────────
function formatYear(year, year_end) {
  if (year === null || year === undefined) return "不明";
  const s = year < 0 ? `前${Math.abs(year)}年` : `${year}年`;
  if (year_end !== null && year_end !== undefined) {
    const e = year_end < 0 ? `前${Math.abs(year_end)}年` : `${year_end}年`;
    return `${s}〜${e}`;
  }
  return s;
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}
