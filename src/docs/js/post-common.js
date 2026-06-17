/**
 * js/post-common.js
 * Shared utilities for post.html and protected-post.html.
 *
 * Globals exposed:
 *   ComponentLoader  — dynamic CSS/JS injection (dedup by URL)
 *   loadComponents() — load KaTeX / Highlight.js per post.components
 *   loadAndApplySiteAccent() — fetch site accent from /api/posts and apply CSS vars
 *   makeTablesScrollable() — wrap markdown tables for horizontal scroll
 *   buildToc()       — generate sidebar + inline TOC from article headings
 *   loaderStart()    — start top loading bar animation
 *   loaderDone()     — complete + fade out loading bar
 */

/* ── ComponentLoader ─────────────────────────────────── */
const ComponentLoader = (() => {
  const loaded = new Set();

  function loadCSS(href) {
    if (loaded.has(href)) return Promise.resolve();
    return new Promise((resolve) => {
      const el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = href;
      el.onload = el.onerror = () => {
        loaded.add(href);
        resolve();
      };
      document.head.appendChild(el);
    });
  }

  function loadJS(src) {
    if (loaded.has(src)) return Promise.resolve();
    return new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = el.onerror = () => {
        loaded.add(src);
        resolve();
      };
      document.head.appendChild(el);
    });
  }

  return { loadCSS, loadJS };
})();

/* ── Site accent (from config.js via /api/posts) ─────── */
function applyAccent(accent, accentDark) {
  if (!accent) return;
  const existing = document.getElementById("site-accent");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "site-accent";
  style.textContent = `
    :root     { --accent: ${accent}; }
    body.dark { --accent: ${accentDark || accent}; }
  `;
  document.head.appendChild(style);
}

async function loadAndApplySiteAccent() {
  try {
    const res = await fetch("/api/posts");
    if (!res.ok) return;
    const data = await res.json();
    applyAccent(data.accent, data.accentDark);
  } catch (err) {
    console.warn("Failed to fetch accent from /api/posts:", err);
  }
}

function buildHomeHref() {
  return "/docs/";
}

function applyHomeLinks(root = document) {
  const href = buildHomeHref();
  root.querySelectorAll("a.back-link, a[data-home-link]").forEach((link) => {
    link.href = href;
  });
}

/* ── loadComponents ──────────────────────────────────── */
async function loadComponents(components) {
  const c = components || {};
  const jobs = [];

  if (c.katex) {
    jobs.push(
      ComponentLoader.loadCSS(
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
      )
        .then(() =>
          ComponentLoader.loadJS(
            "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
          ),
        )
        .then(() =>
          ComponentLoader.loadJS(
            "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js",
          ),
        ),
    );
  }

  if (c.highlight) {
    const isDark = document.body.classList.contains("dark");
    const themeCDN = isDark
      ? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
      : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
    jobs.push(
      ComponentLoader.loadCSS(themeCDN).then(() =>
        ComponentLoader.loadJS(
          "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
        ),
      ),
    );
  }

  await Promise.all(jobs);
}

/* ── makeTablesScrollable ───────────────────────────── */
function makeTablesScrollable(root) {
  const container = root || document;
  const tables = container.querySelectorAll("table");

  tables.forEach((table) => {
    if (table.parentElement?.classList.contains("table-scroll")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-scroll";
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

/* ── buildToc ────────────────────────────────────────── */
function buildToc() {
  const article = document.getElementById("article");
  if (!article) return;

  // Exclude headings that live inside the TOC itself
  const headings = [...article.querySelectorAll("h2, h3, h4")].filter(
    (h) => !h.closest("#tocBox, #toc"),
  );

  if (!headings.length) return;

  const tocToggle = document.getElementById("tocToggle");
  const tocBoxEl = document.getElementById("tocBox");
  const tocList = document.getElementById("tocList");
  const tocBox = tocBoxEl?.querySelector("ul");

  if (tocToggle) tocToggle.style.display = "";
  if (tocBoxEl) tocBoxEl.style.display = "";

  headings.forEach((h, i) => {
    const id = "section-" + i;
    h.id = id;

    const makeLink = () => {
      const a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = h.textContent;
      if (h.tagName === "H2") a.classList.add("h2");
      if (h.tagName === "H3") a.classList.add("h3");
      if (h.tagName === "H4") a.classList.add("h4");
      return a;
    };

    if (tocList) tocList.appendChild(makeLink());

    if (tocBox) {
      const li = document.createElement("li");
      if (h.tagName === "H2") li.classList.add("h2");
      if (h.tagName === "H3") li.classList.add("h3");
      if (h.tagName === "H4") li.classList.add("h4");
      li.appendChild(makeLink());
      tocBox.appendChild(li);
    }
  });

  const overlay = document.getElementById("overlay");
  const close = () => document.body.classList.remove("toc-open");

  if (tocToggle)
    tocToggle.addEventListener("click", () =>
      document.body.classList.toggle("toc-open"),
    );
  if (overlay) overlay.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (e.target.matches(".toc a, .toc-box a")) {
      e.preventDefault();
      const target = document.querySelector(e.target.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      close();
    }
  });

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        document
          .querySelectorAll(".toc a")
          .forEach((a) => a.classList.remove("active"));
        const active = document.querySelector(
          `.toc a[href="#${entry.target.id}"]`,
        );
        if (active) active.classList.add("active");
      });
    },
    { rootMargin: "-40% 0px -50% 0px" },
  );

  headings.forEach((h) => obs.observe(h));
}

/* ── Page loader bar ─────────────────────────────────── */
function loaderStart() {
  const el = document.getElementById("page-loader");
  if (el) {
    el.style.display = "";
    el.className = "page-loader loading";
  }
}

function loaderDone() {
  const el = document.getElementById("page-loader");
  if (!el) return;
  el.classList.remove("loading");
  el.classList.add("done");
  setTimeout(() => {
    el.style.display = "none";
  }, 600);
}

/* ── Marked image renderer ──────────────────────────── */
function resolveImageSrc(href) {
  if (typeof href !== "string" || !href) return "";
  // Already absolute
  if (/^https?:\/\//i.test(href)) return href;
  // Normalize Windows backslashes → forward slashes
  const normalized = href.replace(/\\/g, "/");
  // Strip leading slash if present, then prepend API path
  const clean = normalized.replace(/^\//, "");
  return `/api/image?path=${encodeURIComponent(clean)}`;
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMarkedOptions() {
  const renderer = new marked.Renderer();
  renderer.image = (href, title, text) => {
    const token =
      href && typeof href === "object" ? href : { href, title, text };
    const src = resolveImageSrc(token.href);
    const titleAttr = token.title ? ` title="${escapeAttr(token.title)}"` : "";
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(
      token.text,
    )}"${titleAttr} loading="lazy">`;
  };
  return { renderer, mangle: false, headerIds: false };
}
