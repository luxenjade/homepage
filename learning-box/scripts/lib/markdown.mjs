import { marked } from "marked";
import { escHtml } from "./html.mjs";

marked.setOptions({ gfm: true, breaks: false });

function extractClozePlaceholders(md) {
  const phrases = [];
  const escaped = md.replace(/⟦⟦([\s\S]*?)⟧⟧/g, (_, text) => {
    phrases.push(text);
    return `CLZPH_${phrases.length - 1}_END`;
  });
  return { escaped, phrases };
}

function restoreClozeSummary(html, phrases) {
  return html.replace(/CLZPH_(\d+)_END/g, (_, index) => {
    return `<span class="cloze-hint">${escHtml(phrases[+index])}</span>`;
  });
}

function restoreClozeQuiz(html, phrases) {
  return html.replace(/CLZPH_(\d+)_END/g, (_, index) => {
    const text = escHtml(phrases[+index]);
    return `<span class="cloze-word cloze-hidden" onclick="toggleCloze(this)" data-answer="${text}">${text}</span>`;
  });
}

export function renderMarkdownSummary(md) {
  const { escaped, phrases } = extractClozePlaceholders(md);
  const html = marked.parse(escaped);
  return restoreClozeSummary(html, phrases);
}

export function renderMarkdownQuiz(md) {
  const { escaped, phrases } = extractClozePlaceholders(md);
  const html = marked.parse(escaped);
  return restoreClozeQuiz(html, phrases);
}

export function countCloze(md) {
  return (md.match(/⟦⟦[\s\S]*?⟧⟧/g) || []).length;
}

export function extractUnitTitle(md, fallback) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}
