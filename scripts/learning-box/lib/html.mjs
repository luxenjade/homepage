export function escHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function hexToLight(hex) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.09)`;
}

export function renderToolCard(item, { href, badge, color }) {
  const tags = (item.tags || [])
    .map(
      (tag) =>
        `<span style="font-size:0.7rem; border:1px solid var(--color-border); border-radius:4px; padding:1px 4px; color:var(--color-text-secondary); background:var(--color-bg);">${escHtml(tag)}</span>`,
    )
    .join("");

  const subjectBadge = `<span style="font-size:0.7rem; font-weight:700; background:var(--color-bg); border:1px solid var(--color-border); padding:2px 6px; border-radius:4px; color:var(--color-text-secondary); text-transform:uppercase;">${escHtml(item.subject)}</span>`;
  const updatedHtml = item.updated
    ? `<span style="font-size:0.7rem; color:var(--color-text-secondary); margin-left:auto;">${escHtml(item.updated)}</span>`
    : "";

  return `<a href="${escHtml(href)}" class="site-card text-decoration-none" style="display:flex; flex-direction:column; height:100%; border-top: 4px solid ${escHtml(color)};">
  <div class="site-card__body" style="flex:1; display:flex; flex-direction:column; gap:0.5rem; padding:1.25rem;">
    <div style="display:flex; align-items:center; width:100%; gap:0.5rem; margin-bottom:0.1rem;">
      ${subjectBadge}
      ${updatedHtml}
    </div>
    <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:${escHtml(color)};">${escHtml(badge)}</div>
    <h5 class="site-card__title" style="margin:0; font-size:1rem; font-weight:700; line-height:1.4;">${escHtml(item.title)}</h5>
    <div style="margin-top:auto; display:flex; flex-wrap:wrap; gap:4px; padding-top:0.25rem;">
      ${tags}
    </div>
  </div>
</a>`;
}

export function replacePlaceholders(template, values) {
  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  );
}
