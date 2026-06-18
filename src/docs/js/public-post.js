// =============================================
// Main — fetch post from /api/post and render
// =============================================
async function loadPost() {
  loaderStart();

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  // Expected: ["docs", "slug"]
  const slugInPath = pathParts[0] === "docs" ? pathParts[1] : null;

  const params = new URLSearchParams(window.location.search);
  const slug = slugInPath || params.get("slug");

  applyHomeLinks();

  const showError = () => {
    document.getElementById("post-loading").style.display = "none";
    document.getElementById("post-error").style.display = "";
    loaderDone();
  };

  if (!slug) {
    showError();
    return;
  }

  // 1. Fetch post JSON
  let post;
  try {
    const res = await fetch(`/api/post?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("not found");
    post = await res.json();
  } catch {
    showError();
    return;
  }

  // 2. Metadata
  document.title = (post.title || slug) + " — My Notes";

  if (post.thumbnail) {
    const img = document.getElementById("post-thumbnail");
    img.src = post.thumbnail;
    img.style.display = "";
  }

  document.getElementById("post-title").textContent = post.title || slug;

  if (post.date) {
    const [y, m, d] = post.date.split("-");
    document.getElementById("post-date").textContent =
      `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }

  // Tags
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

  // 3. Markdown → HTML
  marked.use({ mangle: false, headerIds: false });
  const postBody = document.getElementById("post-body");
  postBody.innerHTML = marked.parse(post.content || "");
  makeTablesScrollable(postBody);

  // 4. Show content
  document.getElementById("post-loading").style.display = "none";
  document.getElementById("post-content").style.display = "";
  document.getElementById("post-footer").style.display = "";

  loaderDone();

  // 5. TOC (after content is in the DOM)
  buildToc();
}

marked.use(buildMarkedOptions());
document.addEventListener("DOMContentLoaded", loadPost);
