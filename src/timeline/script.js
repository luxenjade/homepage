// ============================================================
// timeline/script.js
// 縦軸タイムライン + Bootstrap モーダル
//
// データフロー:
//   slug → config.fetchData() → 全レコード（event/period/person混在）
//   → script.js 内で record_type ごとに分岐
//   → renderTimeline(events, periods, catId, searchVal)
// ============================================================

import { db } from "/js/supabase_config.js";

window._db = db;

// ── slug ロード ───────────────────────────────────────────────
const slug = new URLSearchParams(location.search).get("slug");
if (slug) {
  import(`./config/${slug}.js`)
    .then((module) => initTimeline(module.default))
    .catch(() => {
      setStateMsg("config/" + slug + ".js が見つかりません。");
    });
}

// ============================================================
// initTimeline
// ============================================================
async function initTimeline(cfg) {
  if (!cfg) {
    setStateMsg("TIMELINE_CONFIG が定義されていません。");
    return;
  }

  // ── ページ情報を適用 ──────────────────────────────────────
  document.title = cfg.title + " | Shoei451";
  document.getElementById("header-title").textContent = cfg.title;
  document.getElementById("back-link").href = cfg.backLink || "/index.html";
  document.getElementById("back-label").textContent = cfg.backLabel || "ホーム";
  document.getElementById("search-input").hidden = cfg.showSearch === false;
  document.querySelector(".tl-meta-bar").hidden = cfg.showStats === false;

  if (cfg.accentColor) {
    document.documentElement.style.setProperty("--tl-accent", cfg.accentColor);
    document.documentElement.style.setProperty(
      "--color-accent",
      cfg.accentColor,
    );
  }

  if (typeof cfg.renderApp === "function") {
    try {
      await cfg.renderApp({
        cfg,
        root: document.getElementById("tl-app-root"),
        tabsWrap: document.getElementById("tabs-wrap"),
        legendWrap: document.getElementById("legend-wrap"),
        stateEl: document.getElementById("state-msg"),
      });
    } catch (e) {
      setStateMsg("アプリの読み込みに失敗しました: " + e.message);
    }
    return;
  }

  // ── データ取得 ────────────────────────────────────────────
  let rawData = [];
  try {
    rawData = await cfg.fetchData();
  } catch (e) {
    setStateMsg("データの読み込みに失敗しました: " + e.message);
    return;
  }

  // record_type で分岐
  const events = rawData.filter(
    (r) => r.record_type === "event" || !r.record_type,
  );
  const lines =
    cfg.showPeriodLines !== false
      ? rawData.filter(
          (r) => r.record_type === "period" || r.record_type === "person",
        )
      : [];

  // ── カテゴリタブ ──────────────────────────────────────────
  buildTabs(cfg, events);

  // ── 凡例 ─────────────────────────────────────────────────
  buildLegend(cfg);

  // ── no-lines クラス ──────────────────────────────────────
  if (cfg.showPeriodLines === false) {
    document.getElementById("tl-layout").classList.add("no-lines");
    document.getElementById("tl-lines-col").style.display = "none";
  }

  // ── 初期レンダリング ──────────────────────────────────────
  renderTimeline(cfg, events, lines, "all", "");

  // ── 検索 ─────────────────────────────────────────────────
  document.getElementById("search-input").addEventListener("input", (e) => {
    const activeTab = document.querySelector(".tl-tab.is-active");
    renderTimeline(
      cfg,
      events,
      lines,
      activeTab?.dataset.cat || "all",
      e.target.value,
    );
  });

  // ── dialog 閉じるボタン ─────────────────────────────────────
  document.querySelectorAll(".tl-dialog__close").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("tl-detail-modal").close();
    });
  });
  // backdrop クリックで閉じる
  document.getElementById("tl-detail-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  });
}

// ============================================================
// buildTabs
// ============================================================
function buildTabs(cfg, events) {
  const wrap = document.getElementById("tabs-wrap");
  const cats = cfg.categories || [];

  const allBtn = makeTabBtn("all", "すべて", null, cfg, events);
  allBtn.classList.add("is-active");
  wrap.appendChild(allBtn);

  cats.forEach((cat) => {
    wrap.appendChild(makeTabBtn(cat.id, cat.label, cat, cfg, events));
  });
}

function makeTabBtn(catId, label, catDef, cfg, events) {
  const btn = document.createElement("button");
  btn.className = "tl-tab";
  btn.dataset.cat = catId;

  const swatch = catDef
    ? `<span class="tl-tab__swatch" style="background:${catDef.fg};"></span>`
    : "";

  btn.innerHTML = `${swatch}${esc(label)}`;

  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tl-tab")
      .forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const search = document.getElementById("search-input").value;
    const lines = cfg.showPeriodLines !== false ? window._tlLines || [] : [];
    renderTimeline(cfg, events, lines, catId, search);
  });

  return btn;
}

// ============================================================
// buildLegend
// ============================================================
function buildLegend(cfg) {
  const wrap = document.getElementById("legend-wrap");
  if (!wrap) return;
  wrap.innerHTML = "";
  wrap.hidden = true;
}

// ============================================================
// renderTimeline
// ============================================================
function renderTimeline(cfg, allEvents, allLines, catId, searchVal) {
  // キャッシュ（タブクリック時の lines 参照用）
  window._tlLines = allLines;

  const q = searchVal.trim().toLowerCase();

  // フィルタ
  const filtered = allEvents.filter((row) => {
    const catMatch = catId === "all" || cfg.getCategory(row) === catId;
    const searchMatch =
      !q ||
      (cfg.getEvent(row) || "").toLowerCase().includes(q) ||
      (cfg.getDescription(row) || "").toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  // 統計更新
  document.getElementById("stat-total").textContent = allEvents.length;
  document.getElementById("stat-shown").textContent = filtered.length;

  const layout = document.getElementById("tl-layout");
  const stateMsg = document.getElementById("state-msg");

  if (filtered.length === 0) {
    layout.style.display = "none";
    setStateMsg("該当するデータがありません。");
    return;
  }

  stateMsg.style.display = "none";
  layout.style.display = "grid";

  // 年代でソート
  const sorted = [...filtered].sort((a, b) => {
    const ya = getYear(a, cfg);
    const yb = getYear(b, cfg);
    if (ya === null && yb === null) return 0;
    if (ya === null) return 1;
    if (yb === null) return -1;
    return ya - yb;
  });

  const N = sorted.length;

  // ── 年代軸を構築 ──────────────────────────────────────────
  renderAxis(sorted, cfg, N);

  // ── ライン（period/person）を構築 ────────────────────────
  if (cfg.showPeriodLines !== false) {
    renderLines(allLines, sorted, cfg, N);
  }

  // ── 出来事ドットを構築 ───────────────────────────────────
  renderEvents(sorted, cfg, N);
}

// ============================================================
// renderAxis | 年代ラベルを等間隔で間引いて表示
// ============================================================
function renderAxis(sorted, cfg, N) {
  const axisEl = document.getElementById("tl-axis");
  // 既存ラベルをクリア（.tl-axis__line は残す）
  axisEl.querySelectorAll(".tl-axis__label").forEach((el) => el.remove());

  // 行の高さ（CSS .tl-row の min-height: 40px と合わせる）
  const ROW_H = 40;
  const totalH = N * ROW_H;
  axisEl.style.height = totalH + "px";

  // ラベルを間引く（最大20件程度）
  const step = Math.max(1, Math.ceil(N / 20));

  for (let i = 0; i < N; i += step) {
    const row = sorted[i];
    const y = i * ROW_H + ROW_H / 2; // 行の中央
    const yearStr = cfg.formatYear(row);
    if (!yearStr) continue;

    const label = document.createElement("span");
    label.className = "tl-axis__label";
    label.style.top = y + "px";
    label.textContent = yearStr;
    axisEl.appendChild(label);
  }
}

// ============================================================
// renderLines | period/person の縦ライン
// ============================================================
function renderLines(lines, sorted, cfg, N) {
  const col = document.getElementById("tl-lines-col");
  col.innerHTML = "";

  if (!lines.length) return;

  const ROW_H = 40;
  const totalH = N * ROW_H;
  col.style.height = totalH + "px";
  col.style.position = "relative";

  // イベント行の年代インデックス（行番号を年代へのマップ）
  const yearToIndex = new Map();
  sorted.forEach((row, i) => {
    const y = getYear(row, cfg);
    if (y !== null && !yearToIndex.has(y)) yearToIndex.set(y, i);
  });

  // 最小・最大年代（index用）
  const minYear = getYear(sorted[0], cfg) ?? 0;
  const maxYear = getYear(sorted[N - 1], cfg) ?? 0;
  const yearRange = maxYear - minYear || 1;

  // ラインを横に並べるため、重なりチェック（簡易）
  const slots = []; // [{start, end}] 各スロットの使用済み範囲

  function findSlot(startY, endY) {
    for (let s = 0; s < slots.length; s++) {
      const used = slots[s];
      const overlaps = used.some((r) => r.end > startY && r.start < endY);
      if (!overlaps) {
        used.push({ start: startY, end: endY });
        return s;
      }
    }
    slots.push([{ start: startY, end: endY }]);
    return slots.length - 1;
  }

  const lineColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--tl-accent")
      .trim() ||
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim() ||
    "#faba40";

  lines.forEach((line) => {
    const startYear = line.year;
    const endYear = line.year_end ?? line.year;
    if (startYear === null || startYear === undefined) return;

    // ピクセル位置をインデックスベースで計算
    const startIdx = yearToRowIndex(startYear, sorted, cfg, N);
    const endIdx = yearToRowIndex(endYear, sorted, cfg, N);

    const startY = startIdx * ROW_H;
    const endY = Math.max((endIdx + 1) * ROW_H, startY + ROW_H);
    const height = endY - startY;

    const slot = findSlot(startY, endY);
    const leftOffset = 4 + slot * 8; // スロットごとに右にずらす

    const lineEl = document.createElement("div");
    lineEl.className = "tl-line";
    lineEl.style.top = startY + "px";
    lineEl.style.height = height + "px";
    lineEl.style.left = leftOffset + "px";
    lineEl.style.setProperty("--tl-line-color", lineColor);

    const label = cfg.getEvent(line) || "";
    lineEl.setAttribute("data-label", label);

    // モバイル用タップ → モーダル
    lineEl.addEventListener("click", () => openModal(line, cfg));

    col.appendChild(lineEl);
  });

  // ライン帯の幅を動的に調整
  const neededWidth = Math.max(24, slots.length * 12 + 8);
  document.documentElement.style.setProperty(
    "--tl-lines-width",
    neededWidth + "px",
  );
}

// year → 行インデックス（最近傍で検索）
function yearToRowIndex(year, sorted, cfg, N) {
  if (N === 0) return 0;
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < N; i++) {
    const y = getYear(sorted[i], cfg);
    if (y === null) continue;
    const diff = Math.abs(y - year);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ============================================================
// renderEvents | 出来事ドット列
// ============================================================
function renderEvents(sorted, cfg, N) {
  const col = document.getElementById("tl-events-col");
  col.innerHTML = "";

  const ROW_H = 40;
  col.style.minHeight = N * ROW_H + "px";

  const cats = cfg.categories || [];

  sorted.forEach((row) => {
    const row_el = document.createElement("div");
    row_el.className = "tl-row";
    row_el.style.height = ROW_H + "px";

    const dot = document.createElement("div");
    dot.className = "tl-dot";

    // カテゴリで色付け
    const cat = cfg.getCategory(row);
    const catDef = cats.find((c) => c.id === cat);
    if (catDef) {
      dot.style.setProperty("--tl-dot-color", catDef.fg);
      dot.style.borderColor = catDef.fg;
    }

    const label = document.createElement("span");
    label.className = "tl-dot__label";
    label.textContent = cfg.getEvent(row) || "";

    // カテゴリチップ（デスクトップのみ）
    if (catDef) {
      const chip = document.createElement("span");
      chip.className = "tl-dot__cat";
      chip.style.background = catDef.fg;
      chip.style.borderColor = catDef.fg;
      chip.textContent = catDef.label;
      label.appendChild(chip);
    }

    // クリックでモーダル
    const openDetail = () => openModal(row, cfg);
    dot.addEventListener("click", openDetail);
    label.addEventListener("click", openDetail);

    row_el.appendChild(dot);
    row_el.appendChild(label);
    col.appendChild(row_el);
  });
}

// ============================================================
// openModal | Bootstrap モーダルに詳細を表示
// ============================================================
function openModal(row, cfg) {
  const body = document.getElementById("tl-modal-body");
  const yearStr = cfg.formatYear(row);
  const eventStr = cfg.getEvent(row) || "";
  const descStr = cfg.getDescription(row) || "";
  const cat = cfg.getCategory(row);
  const cats = cfg.categories || [];
  const catDef = cats.find((c) => c.id === cat);

  const recordType = row.record_type;
  const typeLabel =
    recordType === "period" ? "期間" : recordType === "person" ? "人物" : "";

  // タグ（地域・分野）
  const regions = (row.region || []).join(" · ");
  const field = row.field || "";
  const normalizedField = String(field).trim();
  const normalizedCatLabel = String(catDef?.label || "").trim();
  const normalizedCatId = String(catDef?.id || "").trim();

  let tagsHtml = "";
  if (catDef) {
    tagsHtml += `<span class="tl-modal__tag" style="background:${catDef.fg};border-color:${catDef.fg}">${esc(catDef.label)}</span>`;
  }
  if (typeLabel) {
    tagsHtml += `<span class="tl-modal__tag">${esc(typeLabel)}</span>`;
  }
  if (
    normalizedField &&
    normalizedField !== normalizedCatLabel &&
    normalizedField !== normalizedCatId
  ) {
    tagsHtml += `<span class="tl-modal__tag">${esc(field)}</span>`;
  }
  if (regions) {
    tagsHtml += `<span class="tl-modal__tag"><i class="bi bi-geo-alt" style="font-size:0.7em;"></i> ${esc(regions)}</span>`;
  }

  // year_end がある場合は範囲表示
  let yearDisplay = yearStr;
  if (row.year_end !== null && row.year_end !== undefined) {
    const endYear =
      row.year_end < 0 ? `前${Math.abs(row.year_end)}年` : `${row.year_end}年`;
    yearDisplay = yearStr + " 〜 " + endYear;
  }

  body.innerHTML = `
    <div class="tl-modal__year">${esc(yearDisplay)}</div>
    ${tagsHtml ? `<div class="tl-modal__tags">${tagsHtml}</div>` : ""}
    ${descStr ? `<p class="tl-modal__desc">${esc(descStr)}</p>` : ""}
    ${
      row.wiki_url
        ? `<a class="tl-modal__wiki" href="${esc(row.wiki_url)}" target="_blank" rel="noopener">
          <i class="bi bi-box-arrow-up-right"></i> Wikipedia
        </a>`
        : ""
    }
  `;
  document.getElementById("tl-modal-label").textContent = eventStr;

  const dialog = document.getElementById("tl-detail-modal");
  dialog.showModal();
}

// ============================================================
// Utilities
// ============================================================

function getYear(row, cfg) {
  // cfg.formatYear は表示文字列を返すため、数値は row.year から直接取得
  return row.year !== null && row.year !== undefined ? row.year : null;
}

function setStateMsg(msg) {
  const el = document.getElementById("state-msg");
  if (el) {
    el.textContent = msg;
    el.style.display = "";
  }
  const layout = document.getElementById("tl-layout");
  if (layout) layout.style.display = "none";
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
