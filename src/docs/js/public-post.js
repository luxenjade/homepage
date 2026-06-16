// =============================================
// Main — fetch post from /api/post and render
// =============================================
async function loadPost() {
  loaderStart();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const site = params.get("site") || window.SITE_ID || "";

  applyHomeLinks(site);

  const siteParam = site ? `&site=${encodeURIComponent(site)}` : "";
  void loadAndApplySiteAccent(site);

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
    const res = await fetch(
      `/api/post?slug=${encodeURIComponent(slug)}${siteParam}`,
    );
    if (!res.ok) throw new Error("not found");
    post = await res.json();
  } catch {
    showError();
    return;
  }

  // 2. Load optional libraries before rendering
  await loadComponents(post.components);

  // 3. Metadata
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

  // 4. Markdown → HTML
  marked.use({ mangle: false, headerIds: false });
  const postBody = document.getElementById("post-body");
  postBody.innerHTML = marked.parse(post.content || "");
  makeTablesScrollable(postBody);

  // 5. KaTeX
  if (post.components?.katex && typeof renderMathInElement !== "undefined") {
    renderMathInElement(postBody, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }

  // 6. Highlight.js + dark mode watch
  if (post.components?.highlight && typeof hljs !== "undefined") {
    document
      .querySelectorAll("#post-body pre code")
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

  // 7. Show content
  document.getElementById("post-loading").style.display = "none";
  document.getElementById("post-content").style.display = "";
  document.getElementById("post-footer").style.display = "";

  loaderDone();

  // 8. TOC (after content is in the DOM)
  buildToc();
}

marked.use(buildMarkedOptions());
document.addEventListener("DOMContentLoaded", loadPost);
