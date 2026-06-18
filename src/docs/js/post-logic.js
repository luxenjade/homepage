/**
 * js/post-logic.js
 * Handles fetching and rendering for both public and protected posts uniformly.
 */

const pathParts = window.location.pathname.split("/").filter(Boolean);
// Expected patterns:
//   Public:    /docs/:slug          -> ["docs", "slug"]
//   Protected: /docs/protected/:slug -> ["docs", "protected", "slug"]
let isProtectedMode = pathParts[1] === "protected";
let slug = isProtectedMode ? pathParts[2] : pathParts[1];

// Fallback to URL search parameters if needed
if (!slug) {
  const params = new URLSearchParams(window.location.search);
  slug = params.get("slug");
  if (params.get("protected") === "true") {
    isProtectedMode = true;
  }
}

applyHomeLinks();

/* ── DOM Elements ────────────────────────────────────── */
const form = document.getElementById("password-form");
const passwordInput = document.getElementById("password-input");
const passwordError = document.getElementById("password-error");
const pwOverlay = document.getElementById("password-overlay");
const spinner = document.getElementById("loading-spinner");
const submitText = document.getElementById("submit-text");
const postLoading = document.getElementById("post-loading");
const postError = document.getElementById("post-error");
const postContent = document.getElementById("post-content");
const postFooter = document.getElementById("post-footer");
const overlayTitle = document.getElementById("overlay-post-title");

/* ── Render Function ─────────────────────────────────── */
function renderPost(post) {
  document.title = (post.title || slug) + " — My Notes";
  document.getElementById("post-title").textContent = post.title || slug;

  if (post.thumbnail) {
    const img = document.getElementById("post-thumbnail");
    if (img) {
      img.src = post.thumbnail;
      img.style.display = "";
    }
  }

  if (post.date) {
    const [y, m, d] = post.date.split("-");
    document.getElementById("post-date").textContent = `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }

  const tagsEl = document.getElementById("post-tags");
  if (tagsEl) {
    tagsEl.innerHTML = "";
    (post.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "post-tag";
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
  }

  marked.use({ mangle: false, headerIds: false });
  const postBody = document.getElementById("post-body");
  postBody.innerHTML = marked.parse(post.content || "");
  makeTablesScrollable(postBody);

  // Reveal content
  if (pwOverlay) pwOverlay.classList.add("hidden");
  if (postLoading) postLoading.style.display = "none";
  if (postContent) postContent.style.display = "";
  if (postFooter) postFooter.style.display = "";

  loaderDone();
  buildToc();
}

/* ── Fetch Handlers ──────────────────────────────────── */
async function loadPublicPost() {
  try {
    const res = await fetch(`/api/post?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("not found");
    const post = await res.json();
    renderPost(post);
  } catch {
    showErrorState();
  }
}

async function tryFetchProtectedPost(password) {
  const url = `/api/protected-post?slug=${encodeURIComponent(slug)}&password=${encodeURIComponent(password)}`;
  const res = await fetch(url);
  if (res.status === 401) return { success: false, error: "invalid_password" };
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.error || "server_error" };
  }
  return { success: true, post: await res.json() };
}

function showErrorState() {
  if (postLoading) postLoading.style.display = "none";
  if (postError) postError.style.display = "";
  if (pwOverlay) pwOverlay.classList.add("hidden");
  loaderDone();
}

/* ── Password Submission ────────────────────────────── */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    passwordError.classList.remove("show");
    spinner.classList.add("show");
    submitText.style.display = "none";
    loaderStart();

    try {
      const result = await tryFetchProtectedPost(passwordInput.value);
      if (result.success) {
        sessionStorage.setItem("pw_" + slug, passwordInput.value);
        renderPost(result.post);
      } else {
        loaderDone();
        passwordError.textContent =
          result.error === "server_error" ? "エラーが発生しました。後ほど再試行してください。" : "パスワードが違います。";
        passwordError.classList.add("show");
        passwordInput.value = "";
        passwordInput.focus();
      }
    } catch (err) {
      console.error(err);
      loaderDone();
      passwordError.textContent = "エラーが発生しました。後ほど再試行してください。";
      passwordError.classList.add("show");
    } finally {
      if (spinner) spinner.classList.remove("show");
      if (submitText) submitText.style.display = "inline";
    }
  });
}

/* ── Main Entrypoint ─────────────────────────────────── */
async function initializePostPage() {
  if (!slug) {
    showErrorState();
    return;
  }

  loaderStart();

  if (!isProtectedMode) {
    // Public post workflow
    await loadPublicPost();
  } else {
    // Protected post workflow - setup overlay and title first
    if (pwOverlay) pwOverlay.classList.remove("hidden");
    if (overlayTitle) overlayTitle.textContent = slug;

    // Fetch the list of protected posts to get the friendly title for overlay if available
    try {
      const res = await fetch("/api/protected-posts");
      if (res.ok) {
        const list = await res.json();
        const matched = Array.isArray(list) ? list.find((p) => p?.slug === slug) : null;
        if (matched && overlayTitle) {
          overlayTitle.textContent = matched.title || slug;
        }
      }
    } catch (e) {
      console.warn("Could not pre-fetch protected post metadata:", e);
    }

    // Auto-login if password is saved in sessionStorage
    const savedPassword = sessionStorage.getItem("pw_" + slug);
    if (savedPassword && passwordInput) {
      passwordInput.value = savedPassword;
      form.dispatchEvent(new Event("submit"));
    } else {
      loaderDone();
      if (passwordInput) passwordInput.focus();
    }
  }
}

marked.use(buildMarkedOptions());
document.addEventListener("DOMContentLoaded", initializePostPage);
