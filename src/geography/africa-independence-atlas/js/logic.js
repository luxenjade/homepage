// logic.js | 地図描画・ズーム・パネル・モード切替

let currentMode = "year";
let selectedIso = null;
let zoomBehavior = null;
let svgSel = null; // d3 selection of <svg#map>

// ── MAP RENDER ────────────────────────────────────────────────────────────────
function renderMap(topoData) {
  const container = document.querySelector(".map-area");
  const W = container.clientWidth;
  const H = container.clientHeight;

  const svgEl = document.getElementById("map");
  svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svgEl.setAttribute("width", W);
  svgEl.setAttribute("height", H);
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  // ズーム対象グループ
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.id = "map-g";
  svgEl.appendChild(g);

  const projection = d3
    .geoMercator()
    .center([20, 2])
    .scale(Math.min(W, H) * 1.18)
    .translate([W * 0.46, H * 0.5]);

  const pathGen = d3.geoPath().projection(projection);
  const features = topojson.feature(
    topoData,
    topoData.objects.countries,
  ).features;
  const tooltip = document.getElementById("tooltip");

  features.forEach((feat) => {
    const iso = String(feat.id).padStart(3, "0");
    const isAfrica = AFRICA_ISOS.has(iso);
    const dStr = pathGen(feat);
    if (!dStr) return;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", dStr);
    path.setAttribute("class", isAfrica ? "country" : "country non-africa");
    path.dataset.iso = iso;

    if (isAfrica) {
      path.style.fill = getColor(iso, currentMode);
      const d = africaFull[iso];

      path.addEventListener("mouseenter", () => {
        tooltip.textContent = d ? d.name : iso;
        tooltip.classList.add("visible");
      });
      path.addEventListener("mousemove", (e) => {
        const r = container.getBoundingClientRect();
        tooltip.style.left = e.clientX - r.left + 14 + "px";
        tooltip.style.top = e.clientY - r.top - 32 + "px";
      });
      path.addEventListener("mouseleave", () => {
        tooltip.classList.remove("visible");
      });
      path.addEventListener("click", () => selectCountry(iso, path));
    }

    g.appendChild(path);
  });

  // ── D3 ZOOM ──
  svgSel = d3.select(svgEl);

  zoomBehavior = d3
    .zoom()
    .scaleExtent([0.5, 14])
    .on("zoom", (e) => {
      d3.select("#map-g").attr("transform", e.transform);
    });

  svgSel.call(zoomBehavior);
  // ダブルクリックズームを無効（国クリックと競合）
  svgSel.on("dblclick.zoom", null);

  updateLegend();
}

// ── ZOOM CONTROLS ─────────────────────────────────────────────────────────────
function zoomBy(factor) {
  if (!svgSel || !zoomBehavior) return;
  svgSel.transition().duration(280).call(zoomBehavior.scaleBy, factor);
}

function resetZoom() {
  if (!svgSel || !zoomBehavior) return;
  svgSel
    .transition()
    .duration(380)
    .call(zoomBehavior.transform, d3.zoomIdentity);
}

// ── RECOLOR ───────────────────────────────────────────────────────────────────
function recolorMap() {
  document.querySelectorAll("#map .country:not(.non-africa)").forEach((el) => {
    el.style.fill = getColor(el.dataset.iso, currentMode);
  });
  updateLegend();
}

// ── LEGEND ────────────────────────────────────────────────────────────────────
function updateLegend() {
  const leg = document.getElementById("legend");
  const pairs =
    currentMode === "year"
      ? Object.entries(ERA_LABELS)
      : Object.entries(COL_LABELS);
  const colors = currentMode === "year" ? ERA_COLORS : COL_COLORS;

  leg.innerHTML =
    `<div class="legend-head">${currentMode === "year" ? "独立年代" : "旧宗主国"}</div>` +
    pairs
      .map(
        ([k, l]) =>
          `<div class="legend-row">
         <div class="legend-swatch" style="background:${colors[k]}"></div>
         <span class="legend-label">${l}</span>
       </div>`,
      )
      .join("");
}

// ── COUNTRY SELECT ────────────────────────────────────────────────────────────
function selectCountry(iso, pathEl) {
  document
    .querySelectorAll("#map .country.selected")
    .forEach((el) => el.classList.remove("selected"));
  pathEl.classList.add("selected");
  selectedIso = iso;

  document.getElementById("panel").classList.remove("hidden");
  document.getElementById("hint").classList.remove("panel-closed");
  renderPanel(iso);
}

// ── SIDE PANEL ────────────────────────────────────────────────────────────────
function renderPanel(iso) {
  const d = africaFull[iso];
  const box = document.getElementById("panel-content");

  if (!d) {
    box.innerHTML = `<div class="panel-empty"><p>データがありません</p></div>`;
    return;
  }

  const eraColor = ERA_COLORS[d.era] || "#ccc";
  const colColor = COL_COLORS[d.colonial] || "#ccc";
  const eraLabel = ERA_LABELS[d.era] || "不明";
  const colLabel = COL_LABELS[d.colonial] || "|";
  const yearDisp = d.indYear ? `${d.indYear}年` : "植民地化されず";

  // 言語リスト
  const langsHtml =
    d.langs && d.langs.length
      ? d.langs.map((l) => `<span class="lang-tag">${l}</span>`).join("")
      : `<span class="lang-tag">|</span>`;

  // 国旗：flagcdn画像、失敗時は絵文字にフォールバック
  const url = flagUrl(iso);
  const flagHtml = url
    ? `<img src="${url}" alt="${d.name}の国旗" width="48" height="32"
           onerror="this.outerHTML='<span style=\\'font-size:1.8rem\\'>${d.flag}</span>'">`
    : `<span style="font-size:1.8rem">${d.flag}</span>`;

  box.innerHTML = `
    <div class="panel-header">
      <div class="panel-flag-name">
        <div class="flag-img">${flagHtml}</div>
        <div>
          <div class="panel-name">${d.name}</div>
          <div class="panel-name-en">${d.en}</div>
        </div>
      </div>
      <button class="close-btn" onclick="closePanel()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6"  x2="6"  y2="18"/>
          <line x1="6"  y1="6"  x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="panel-body">
      <div class="info-grid">
        <div class="info-card">
          <div class="ic-label">独立年</div>
          <div class="ic-value year">${yearDisp}</div>
        </div>
        <div class="info-card">
          <div class="ic-label">首都</div>
          <div class="ic-value">${d.capital}</div>
        </div>
        <div class="info-card full">
          <div class="ic-label">独立年代</div>
          <div class="ic-value">
            <span class="badge" style="background:${eraColor}22;color:${eraColor};border:1px solid ${eraColor}55">
              ${eraLabel}
            </span>
          </div>
        </div>
        <div class="info-card full">
          <div class="ic-label">旧宗主国</div>
          <div class="ic-value">
            <span class="badge" style="background:${colColor}22;color:${colColor};border:1px solid ${colColor}55">
              ${colLabel}
            </span>
          </div>
        </div>
        <div class="info-card full">
          <div class="ic-label">公用語</div>
          <div class="ic-value lang-list">${langsHtml}</div>
        </div>
      </div>
      ${
        d.history
          ? `<div class="divider"></div>
           <div class="section-label">独立史</div>
           <div class="history-text">${d.history}</div>`
          : ""
      }
    </div>`;
}

function closePanel() {
  document.getElementById("panel").classList.add("hidden");
  document.getElementById("hint").classList.add("panel-closed");
  document
    .querySelectorAll("#map .country.selected")
    .forEach((el) => el.classList.remove("selected"));
  selectedIso = null;
}

// ── MODE SWITCH ───────────────────────────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll(".mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  recolorMap();
  if (selectedIso) renderPanel(selectedIso);
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
(function boot() {
  const s1 = document.createElement("script");
  s1.src = "https://d3js.org/d3.v7.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://unpkg.com/topojson-client@3/dist/topojson-client.min.js";
    s2.onload = () => {
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
        .then((r) => r.json())
        .then((data) => {
          document.getElementById("loading").style.display = "none";
          renderMap(data);
          window.addEventListener("resize", () => renderMap(data));
        })
        .catch(() => {
          document.getElementById("loading").innerHTML =
            '<span style="color:#e53">地図データの読み込みに失敗しました</span>';
        });
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
})();
