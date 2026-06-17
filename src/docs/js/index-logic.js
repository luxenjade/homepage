// =====================================================
// ユーティリティ
// =====================================================
function formatDateStr(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return y + "年" + parseInt(m) + "月" + parseInt(d) + "日";
}

function resolveHref(post) {
  if (post.slug) {
    // クリーンなURL: /docs/slug
    return `/docs/${encodeURIComponent(post.slug)}`;
  }
  if (post.outputFile) return post.outputFile;
  return "#";
}

// =====================================================
// アイコン
// =====================================================
function iconSVG(icon) {
  if (icon === "github")
    return `
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
        0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695
        -.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99
        .105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225
        -.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405
        c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225
        0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3
        0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>`;
  return "";
}

// =====================================================
// カード生成
// =====================================================
function hasThumbnail(p) {
  return typeof p.thumbnail === "string" && p.thumbnail.trim() !== "";
}

function createPublicCard(p) {
  const a = document.createElement("a");
  a.href = resolveHref(p);
  a.className = "card";
  a.dataset.date = p.date || "";
  a.dataset.category = p.category || "";

  const thumbHtml = hasThumbnail(p)
    ? `<img src="${p.thumbnail}" alt="" loading="lazy" />`
    : `<div class="card-thumb-placeholder"></div>`;

  a.innerHTML = `
    <div class="card-img-wrap">${thumbHtml}</div>
    <div class="card-body">
      <h2 class="card-title">${p.title}</h2>
      <p class="card-desc">${p.description || ""}</p>
      <span class="card-date">${formatDateStr(p.date)}</span>
    </div>
  `;
  return a;
}

function createProtectedCard(p) {
  const a = document.createElement("a");
  // クリーンなURL: /docs/protected/slug
  a.href = `/docs/protected/${encodeURIComponent(p.slug)}`;
  a.className = "card card--protected";
  a.dataset.date = p.date || "";
  a.dataset.category = p.category || "";
  a.innerHTML = `
    <div class="card-img-wrap">
      <div class="card-protected-thumb">🔒</div>
    </div>
    <div class="card-body">
      <span class="card-protected-badge">Protected</span>
      <h2 class="card-title">${p.title}</h2>
      <p class="card-desc">${p.excerpt || "パスワードで保護された記事です。"}</p>
      <span class="card-date">${formatDateStr(p.date)}</span>
    </div>
  `;
  return a;
}

// =====================================================
// 初期化
// =====================================================
async function initialize() {
  const container = document.getElementById("home-container");
  const countEl = document.getElementById("posts-count");
  const tocList = document.getElementById("tocList");
  let selectedCategory = "";

  // 1. 公開記事の取得
  let publicPosts = [];
  try {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      publicPosts = Array.isArray(data.posts) ? data.posts : [];
    }
  } catch (e) {
    console.warn("Failed to fetch /api/posts:", e);
  }

  const allCards = publicPosts.map((p) => ({
    card: createPublicCard(p),
    date: p.date || "",
  }));

  // 2. 保護記事
  try {
    const res = await fetch("/api/protected-posts");
    if (res.ok) {
      const protectedPosts = await res.json();
      protectedPosts.forEach((p) => {
        allCards.push({ card: createProtectedCard(p), date: p.date || "" });
      });
    }
  } catch (e) {
    console.warn("Failed to fetch /api/protected-posts:", e);
  }

  // 3. 日付降順ソート
  allCards.sort((a, b) => b.date.localeCompare(a.date));

  // 4. カテゴリ収集
  const categories = [
    ...new Set(
      allCards.map(({ card }) => card.dataset.category).filter(Boolean),
    ),
  ].sort();

  // 5. サイドバー：カテゴリフィルター + Posts 一覧
  if (tocList) {
    if (categories.length > 0) {
      const bar = document.getElementById("active-category-bar");
      const label = document.getElementById("active-category-label");
      const updateCategoryBar = () => {
        if (!bar || !label) return;
        if (selectedCategory) {
          label.textContent = selectedCategory;
          bar.style.display = "";
        } else {
          label.textContent = "";
          bar.style.display = "none";
        }
      };

      const filterWrap = document.createElement("div");
      filterWrap.id = "category-filters";
      filterWrap.style.cssText = "margin-bottom: 20px;";

      const makeBtn = (label, value) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.dataset.cat = value;
        btn.style.cssText = `
          display: block; width: 100%; text-align: left;
          background: none; border: none; cursor: pointer;
          padding: 6px 0; font-size: 0.9rem;
          color: var(--sub); font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
        `;
        btn.addEventListener("mouseenter", () => {
          if (!btn.classList.contains("active"))
            btn.style.color = "var(--text)";
        });
        btn.addEventListener("mouseleave", () => {
          if (!btn.classList.contains("active")) btn.style.color = "var(--sub)";
        });
        return btn;
      };

      const allBtn = makeBtn("All", "");
      allBtn.classList.add("active");
      allBtn.style.color = "var(--text)";
      allBtn.style.borderBottomColor = "var(--accent)";
      updateCategoryBar();
      filterWrap.appendChild(allBtn);
      categories.forEach((cat) => filterWrap.appendChild(makeBtn(cat, cat)));

      filterWrap.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-cat]");
        if (!btn) return;
        selectedCategory = btn.dataset.cat;

        filterWrap.querySelectorAll("button").forEach((b) => {
          b.classList.remove("active");
          b.style.color = "var(--sub)";
          b.style.borderBottomColor = "transparent";
        });
        btn.classList.add("active");
        btn.style.color = "var(--text)";
        btn.style.borderBottomColor = "var(--accent)";

        container.querySelectorAll(".card").forEach((card) => {
          card.style.display =
            !selectedCategory || card.dataset.category === selectedCategory
              ? ""
              : "none";
        });
        tocList.querySelectorAll("a[data-cat]").forEach((a) => {
          a.style.display =
            !selectedCategory || a.dataset.cat === selectedCategory
              ? ""
              : "none";
        });
        updateCategoryBar();
      });

      tocList.before(filterWrap);

      document
        .getElementById("active-category-clear")
        ?.addEventListener("click", () => {
          filterWrap.querySelector("button[data-cat='']")?.click();
        });
    }

    allCards.forEach(({ card }) => {
      const a = document.createElement("a");
      a.href = card.href;
      a.textContent =
        card.querySelector(".card-title")?.textContent || "(no title)";
      a.dataset.cat = card.dataset.category || "";
      tocList.appendChild(a);
    });
  }

  // 6. カードをレンダリング
  if (countEl) countEl.textContent = allCards.length + " posts";
  allCards.forEach(({ card }) => container.appendChild(card));

  // =====================================================
  // 検索
  // =====================================================
  (function () {
    const input = document.getElementById("post-search");
    const clearBtn = document.getElementById("search-clear");
    const noResults = document.createElement("p");
    noResults.className = "search-no-results";
    noResults.textContent = "No posts found.";
    noResults.style.display = "none";
    container.after(noResults);

    let activeCat = "";

    // カテゴリフィルターが変わったときにactiveCatを同期させる
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      activeCat = btn.dataset.cat;
      applyFilter();
    });

    function applyFilter() {
      const q = (input?.value || "").trim().toLowerCase();
      clearBtn.style.display = q ? "" : "none";

      let visible = 0;
      allCards.forEach(({ card }) => {
        const title = (
          card.querySelector(".card-title")?.textContent || ""
        ).toLowerCase();
        const desc = (
          card.querySelector(".card-desc")?.textContent || ""
        ).toLowerCase();
        const cat = card.dataset.category || "";

        const matchesSearch = !q || title.includes(q) || desc.includes(q);
        const matchesCat = !activeCat || cat === activeCat;

        const show = matchesSearch && matchesCat;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });

      // サイドバーのリンクはカテゴリのみ（検索は絡めない）
      tocList?.querySelectorAll("a[data-cat]").forEach((a) => {
        a.style.display =
          !activeCat || a.dataset.cat === activeCat ? "" : "none";
      });

      noResults.style.display = visible === 0 ? "" : "none";
      if (countEl) countEl.textContent = visible + " posts";
    }

    input?.addEventListener("input", applyFilter);

    clearBtn?.addEventListener("click", () => {
      if (input) {
        input.value = "";
        input.focus();
      }
      applyFilter();
    });
  })();
}

document.addEventListener("DOMContentLoaded", initialize);

// =====================================================
// サイドバー開閉
// =====================================================
(function () {
  const toggle = document.getElementById("tocToggle");
  const overlay = document.getElementById("overlay");
  if (!toggle || !overlay) return;
  const close = () => document.body.classList.remove("toc-open");
  toggle.addEventListener("click", () =>
    document.body.classList.toggle("toc-open"),
  );
  overlay.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();
