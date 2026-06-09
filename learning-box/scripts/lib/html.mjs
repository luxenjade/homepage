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
        `<span class="tool-card__tag">${escHtml(tag)}</span>`,
    )
    .join("");

  return `<a class="tool-card" href="${escHtml(href)}" data-subject="${escHtml(item.subject)}" style="--card-color:${escHtml(color)}">
  <div class="tool-card__bar"></div>
  <div class="tool-card__body">
    <div class="tool-card__meta">
      <span class="tool-card__subject">${escHtml(item.subject)}</span>
      <span class="tool-card__updated">${escHtml(item.updated || "")}</span>
    </div>
    <h3 class="tool-card__title">${escHtml(item.title)}</h3>
    <div class="tool-card__tags">${tags}</div>
  </div>
  <div class="tool-card__footer">
    <span class="tool-card__badge"><strong>${escHtml(badge)}</strong></span>
    <span class="tool-card__arrow">→</span>
  </div>
</a>`;
}

export function replacePlaceholders(template, values) {
  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  );
}
