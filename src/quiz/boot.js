const BASE = "/";
const COMPONENT_SCRIPTS = [
  "choice-buttons",
  "text-input",
  "table-input",
  "start-screen",
  "progress",
  "question-area",
  "feedback",
  "result",
  "modal",
].map((name) => `${BASE}quiz/components/${name}.js`);

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });
}

function setStateMessage(message) {
  document.getElementById("state-msg").textContent = message;
}

function applyHeader(cfg) {
  document.title = cfg.title + " | luxenjade";
  document.getElementById("qz-header-title").textContent = cfg.title;

  if (cfg.subtitle) {
    document.getElementById("qz-header-subtitle").textContent = cfg.subtitle;
  }

  if (cfg.backLink) {
    const backEl = document.getElementById("qz-back-link");
    backEl.href = cfg.backLink;
    backEl.textContent = cfg.backLabel ?? "戻る";
  }

  if (cfg.accentColor) {
    document.documentElement.style.setProperty("--qz-accent", cfg.accentColor);
  }
}

async function loadQuizConfig(slug) {
  await loadScript(`${BASE}quiz/config/${slug}.js`);
  if (!window.QUIZ_CONFIG) {
    throw new Error("QUIZ_CONFIG が定義されていません: " + slug);
  }
  return window.QUIZ_CONFIG;
}

async function loadOptionalDependencies(cfg) {
  const loads = [];

  if (cfg.supabaseTable) {
    loads.push(
      loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2").then(
        () =>
          import("/js/supabase_config.js").then(({ db, tables }) => {
            window.db = db;
            window._db = db;
            window.SUPABASE_TABLES = tables;
          }),
      ),
    );
  }

  if (cfg.tutorialMd) {
    loads.push(loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js"));
  }

  if (cfg.dataScript) {
    loads.push(loadScript(cfg.dataScript));
  }

  await Promise.all(loads);
}

async function boot() {
  let slug = new URLSearchParams(location.search).get("slug");

  if (!slug) {
    const match = location.pathname.match(/\/quiz\/([^/]+)/);
    if (match) {
      slug = match[1];
    }
  }

  if (!slug) {
    setStateMessage("slug パラメータが指定されていません。");
    return;
  }

  await Promise.all([
    loadScript(`${BASE}js/wh-utils.js`),
    ...COMPONENT_SCRIPTS.map(loadScript),
  ]);

  const cfg = await loadQuizConfig(slug);
  await loadOptionalDependencies(cfg);
  await loadScript(`${BASE}quiz/logic.js`);

  applyHeader(cfg);
  window.initQuizLogic(cfg);
}

boot().catch((err) => {
  setStateMessage("読み込みエラー: " + err.message);
  console.error(err);
});
