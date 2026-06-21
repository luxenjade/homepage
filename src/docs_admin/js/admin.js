// docs_admin/js/admin.js
// Shared admin logic for index.html and edit.html

/* ── helpers ─────────────────────────────────────────── */

function getAdminPw() {
  return sessionStorage.getItem("admin_pw") || "";
}

function setAdminPw(pw) {
  if (pw) sessionStorage.setItem("admin_pw", pw);
  else sessionStorage.removeItem("admin_pw");
}

function apiFetch(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set("X-Admin-Password", getAdminPw());
  if (opts.body && typeof opts.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...opts, headers });
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/* ── login ───────────────────────────────────────────── */

function initLogin() {
  const overlay = document.getElementById("login-overlay");
  const panel = document.getElementById("admin-panel") || document.getElementById("editor-panel");
  const input = document.getElementById("admin-password");
  const btn = document.getElementById("login-btn");
  const err = document.getElementById("login-error");

  if (!overlay || !panel) return;

  // Auto-login if password exists
  if (getAdminPw()) {
    overlay.style.display = "none";
    panel.style.display = "";
    return true;
  }

  btn.addEventListener("click", async () => {
    err.style.display = "none";
    const pw = input.value.trim();
    if (!pw) {
      err.textContent = "Password is required";
      err.style.display = "";
      return;
    }

    // Verify with a lightweight ping
    try {
      const res = await apiFetch("/api/admin/posts", { method: "HEAD" });
      if (res.status === 401) throw new Error("Invalid password");
      // HEAD may not be allowed, try GET
      if (!res.ok) {
        const getRes = await apiFetch("/api/admin/posts");
        if (getRes.status === 401) throw new Error("Invalid password");
        if (!getRes.ok) throw new Error("Server error");
      }
    } catch (e) {
      err.textContent = e.message || "Invalid password";
      err.style.display = "";
      return;
    }

    setAdminPw(pw);
    overlay.style.display = "none";
    panel.style.display = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });

  return false;
}

/* ── list page (index.html) ──────────────────────────── */

async function loadPosts() {
  const loading = document.getElementById("loading");
  const tableWrap = document.getElementById("posts-table-wrap");
  const tbody = document.getElementById("posts-body");
  const empty = document.getElementById("empty-state");

  try {
    const res = await apiFetch("/api/admin/posts");
    if (!res.ok) throw new Error("Failed to load");
    const { posts } = await res.json();

    loading.style.display = "none";
    if (!posts || posts.length === 0) {
      empty.style.display = "";
      return;
    }

    tableWrap.style.display = "";
    tbody.innerHTML = posts
      .map(
        (p) => `
      <tr>
        <td>
          <span class="badge badge-${p.type}">${p.type}</span>
        </td>
        <td>
          <a class="slug-link" href="/docs/${p.type === "private" ? "protected/" : ""}${encodeURIComponent(p.slug)}" target="_blank">
            ${escHtml(p.slug)}
          </a>
        </td>
        <td>${escHtml(p.title)}</td>
        <td>${escHtml(p.date || "—")}</td>
        <td>${escHtml(p.category || "—")}</td>
        <td style="text-align: right">
          <a class="btn btn-sm" href="edit.html?slug=${encodeURIComponent(p.slug)}&type=${p.type}">Edit</a>
          <button class="btn btn-sm btn-danger" data-slug="${escHtml(p.slug)}" data-type="${p.type}">Delete</button>
        </td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll("button[data-slug]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this post?")) return;
        const slug = btn.dataset.slug;
        const type = btn.dataset.type;
        try {
          const res = await apiFetch(`/api/admin/post?slug=${encodeURIComponent(slug)}&type=${type}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Delete failed");
          btn.closest("tr").remove();
        } catch (e) {
          alert("Delete failed: " + e.message);
        }
      });
    });
  } catch (e) {
    console.error(e);
    loading.textContent = "Error loading posts.";
  }
}

/* ── editor page (edit.html) ─────────────────────────── */

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function initEditor() {
  const isEdit = !!getQueryParam("slug");
  document.getElementById("page-title").textContent = isEdit ? "Edit Post" : "New Post";

  const typeRadios = document.querySelectorAll("input[name='p-type']");
  const pwGroup = document.getElementById("pw-group");
  const descGroup = document.getElementById("desc-group");
  const excerptGroup = document.getElementById("excerpt-group");
  const editor = document.getElementById("content-editor");
  const preview = document.getElementById("preview-panel");
  const saveBtn = document.getElementById("save-btn");
  const saveMsg = document.getElementById("save-msg");

  function updateTypeUI() {
    const type = document.querySelector("input[name='p-type']:checked").value;
    if (type === "private") {
      pwGroup.classList.remove("hidden");
      descGroup.classList.add("hidden");
      excerptGroup.classList.remove("hidden");
    } else {
      pwGroup.classList.add("hidden");
      descGroup.classList.remove("hidden");
      excerptGroup.classList.add("hidden");
    }
  }

  typeRadios.forEach((r) => r.addEventListener("change", updateTypeUI));

  function renderPreview() {
    const md = editor.value || "";
    preview.innerHTML = md.trim()
      ? marked.parse(md, { mangle: false, headerIds: false })
      : '<p style="color: var(--sub)">Preview will appear here...</p>';
  }

  editor.addEventListener("input", () => {
    clearTimeout(window._previewTimer);
    window._previewTimer = setTimeout(renderPreview, 300);
  });

  // Load existing post if editing
  if (isEdit) {
    const slug = getQueryParam("slug");
    const type = getQueryParam("type") || "public";
    loadPostForEdit(slug, type);
  }

  saveBtn.addEventListener("click", async () => {
    saveMsg.style.display = "none";
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    try {
      const payload = buildPayload();
      let res;

      if (isEdit) {
        const oldSlug = getQueryParam("slug");
        const oldType = getQueryParam("type") || "public";
        res = await apiFetch("/api/admin/post", {
          method: "PUT",
          body: JSON.stringify({ oldSlug, oldType, ...payload }),
        });
      } else {
        res = await apiFetch("/api/admin/post", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Save failed");
      }

      saveMsg.textContent = "Saved!";
      saveMsg.className = "ok";
      saveMsg.style.display = "";

      if (!isEdit) {
        // Redirect to edit mode after creation
        const newUrl = `edit.html?slug=${encodeURIComponent(payload.slug)}&type=${payload.type}`;
        history.replaceState(null, "", newUrl);
        document.getElementById("page-title").textContent = "Edit Post";
      }
    } catch (e) {
      console.error(e);
      saveMsg.textContent = e.message || "Save failed";
      saveMsg.className = "err";
      saveMsg.style.display = "";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  });

  updateTypeUI();
  renderPreview();
}

async function loadPostForEdit(slug, type) {
  try {
    const res = await apiFetch("/api/admin/posts");
    if (!res.ok) throw new Error("Failed to load");
    const { posts } = await res.json();
    const post = posts.find((p) => p.slug === slug && p.type === type);
    if (!post) throw new Error("Post not found");

    document.getElementById("p-slug").value = post.slug || "";
    document.getElementById("p-title").value = post.title || "";
    document.getElementById("p-date").value = post.date || "";
    document.getElementById("p-category").value = post.category || "";
    document.getElementById("p-tags").value = (post.tags || []).join(", ");
    document.getElementById("p-thumbnail").value = post.thumbnail || "";
    document.getElementById("p-description").value = post.description || "";
    document.getElementById("p-excerpt").value = post.excerpt || "";
    document.getElementById("content-editor").value = post.content || "";

    const typeRadio = document.querySelector(`input[name='p-type'][value="${type}"]`);
    if (typeRadio) typeRadio.checked = true;

    // Trigger preview and type UI update
    document.getElementById("content-editor").dispatchEvent(new Event("input"));
    document.querySelector("input[name='p-type']:checked").dispatchEvent(new Event("change"));
  } catch (e) {
    console.error(e);
    alert("Failed to load post: " + e.message);
  }
}

function buildPayload() {
  const type = document.querySelector("input[name='p-type']:checked").value;
  const tagsRaw = document.getElementById("p-tags").value.trim();
  const tags = tagsRaw
    ? tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    : [];

  const payload = {
    slug: document.getElementById("p-slug").value.trim(),
    title: document.getElementById("p-title").value.trim(),
    date: document.getElementById("p-date").value || null,
    category: document.getElementById("p-category").value.trim() || null,
    tags,
    thumbnail: document.getElementById("p-thumbnail").value.trim() || null,
    content: document.getElementById("content-editor").value,
    type,
  };

  if (type === "public") {
    payload.description = document.getElementById("p-description").value.trim() || null;
  } else {
    payload.excerpt = document.getElementById("p-excerpt").value.trim() || null;
    const pw = document.getElementById("p-password").value.trim();
    if (pw) payload.password = pw;
  }

  return payload;
}

/* ── boot ────────────────────────────────────────────── */

function boot() {
  const loggedIn = initLogin();
  if (!loggedIn) {
    // Wait for login before initializing
    const btn = document.getElementById("login-btn");
    const onLogin = () => {
      setTimeout(() => {
        if (document.getElementById("admin-panel")) loadPosts();
        if (document.getElementById("editor-panel")) initEditor();
      }, 50);
    };
    if (btn) btn.addEventListener("click", onLogin, { once: true });
    return;
  }

  if (document.getElementById("admin-panel")) loadPosts();
  if (document.getElementById("editor-panel")) initEditor();
}

document.addEventListener("DOMContentLoaded", boot);
