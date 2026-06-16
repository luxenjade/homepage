/**
 * js/protected-post.js
 * Depends on: js/post-common.js (ComponentLoader, loadComponents, buildToc, loaderStart, loaderDone)
 */

/* ── URL params ──────────────────────────────────────── */
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const site = params.get("site") || window.SITE_ID || "";

applyHomeLinks(site);

const siteParam = site ? `&site=${encodeURIComponent(site)}` : "";
void loadAndApplySiteAccent(site);

/* ── DOM refs ────────────────────────────────────────── */
const form = document.getElementById("password-form");
const passwordInput = document.getElementById("password-input");
const passwordError = document.getElementById("password-error");
const pwOverlay = document.getElementById("password-overlay");
const spinner = document.getElementById("loading-spinner");
const submitText = document.getElementById("submit-text");
const contentEl = document.getElementById("markdown-content");
const overlayTitle = document.getElementById("overlay-post-title");

/* ── Slug pre-validation + metadata ──────────────────── */
async function getProtectedPostMeta(slug) {
  if (!slug || !/^[\w][\w/-]*$/.test(slug)) {
    return { exists: false, title: "" };
  }

  try {
    const res = await fetch(
      `/api/protected-posts${siteParam ? "?" + siteParam.slice(1) : ""}`,
    );
    if (!res.ok) return { exists: true, title: slug };
    const list = await res.json();
    if (!Array.isArray(list)) return { exists: true, title: slug };

    const matched = list.find((p) => p?.slug === slug);
    return { exists: Boolean(matched), title: matched?.title || slug };
  } catch {
    return { exists: true, title: slug };
  }
}

function showSlugError(msg) {
  const dialog = document.querySelector(".password-dialog");
  if (!dialog) return;
  dialog.innerHTML = `
    <p style="font-size:2rem; margin-bottom:12px;">🔍</p>
    <h2 style="margin-bottom:8px;">Post not found</h2>
    <p style="color:var(--sub); font-size:0.9rem; margin-bottom:20px;">${msg}</p>
    <a href="index.html" data-home-link
       style="display:inline-block; padding:10px 24px; background:var(--accent);
              color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">
      Back to Home
    </a>
  `;
  applyHomeLinks(site, dialog);
}

function setOverlayPostTitle(title) {
  if (!overlayTitle) return;
  overlayTitle.textContent = title || slug || "";
}

/* ── Fetch protected post ────────────────────────────── */
async function fetchProtectedPost(slug, password) {
  const url = `/api/protected-post?slug=${encodeURIComponent(slug)}&password=${encodeURIComponent(password)}${siteParam}`;
  const res = await fetch(url);

  if (res.status === 401) return { success: false, error: "invalid_password" };
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.error || "server_error" };
  }
  return { success: true, post: await res.json() };
}

/* ── Render post (after auth) ────────────────────────── */
async function renderPost(post) {
  await loadComponents(post.components);

  document.getElementById("post-title").textContent = post.title || slug;
  document.title = (post.title || slug) + " — My Notes";

  if (post.date) {
    const [y, m, d] = post.date.split("-");
    document.getElementById("post-meta").textContent =
      `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }

  const tagsEl = document.getElementById("post-tags");
  tagsEl.innerHTML = "";
  (post.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "post-tag";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  document.getElementById("post-header").style.display = "";

  marked.use({ mangle: false, headerIds: false });
  contentEl.innerHTML = marked.parse(post.content || "");
  makeTablesScrollable(contentEl);

  if (post.components?.katex && typeof renderMathInElement !== "undefined") {
    renderMathInElement(contentEl, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }

  if (post.components?.highlight && typeof hljs !== "undefined") {
    contentEl
      .querySelectorAll("pre code")
      .forEach((el) => hljs.highlightElement(el));
    new MutationObserver(() => {
      const dark =
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
      const light =
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
      ComponentLoader.loadCSS(
        document.body.classList.contains("dark") ? dark : light,
      );
    }).observe(document.body, { attributeFilter: ["class"] });
  }

  pwOverlay.classList.add("hidden");
  loaderDone();
  buildToc();
}

/* ── Password form submit ────────────────────────────── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  passwordError.classList.remove("show");
  spinner.classList.add("show");
  submitText.style.display = "none";
  loaderStart();

  try {
    const result = await fetchProtectedPost(slug, passwordInput.value);
    if (result.success) {
      sessionStorage.setItem("pw_" + slug, passwordInput.value);
      await renderPost(result.post);
    } else {
      loaderDone();
      passwordError.textContent =
        result.error === "server_error"
          ? "エラーが発生しました。後ほど再試行してください。"
          : "パスワードが違います。";
      passwordError.classList.add("show");
      passwordInput.value = "";
      passwordInput.focus();
    }
  } catch (err) {
    console.error(err);
    loaderDone();
    passwordError.textContent =
      "エラーが発生しました。後ほど再試行してください。";
    passwordError.classList.add("show");
  } finally {
    spinner.classList.remove("show");
    submitText.style.display = "inline";
  }
});

/* ── Init ────────────────────────────────────────────── */
window.addEventListener("DOMContentLoaded", async () => {
  loaderStart();

  const meta = await getProtectedPostMeta(slug);
  if (!meta.exists) {
    loaderDone();
    showSlugError(
      slug
        ? `"${slug}" という保護記事は存在しません。`
        : "slug が指定されていません。",
    );
    return;
  }
  setOverlayPostTitle(meta.title);

  loaderDone();

  const saved = sessionStorage.getItem("pw_" + slug);
  if (saved) {
    passwordInput.value = saved;
    form.dispatchEvent(new Event("submit"));
  } else {
    passwordInput.focus();
  }
});

marked.use(buildMarkedOptions());
