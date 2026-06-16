import fs from "node:fs/promises";
import path from "node:path";
import {
  countCloze,
  extractUnitTitle,
  renderMarkdownQuiz,
  renderMarkdownSummary,
} from "./markdown.mjs";

const UNIT_FILE_PATTERN = /^(\d{2})\.md$/;

export async function collectNotes(sourceDir) {
  const notesRoot = path.join(sourceDir, "notes");
  const entries = await fs.readdir(notesRoot, { withFileTypes: true });
  const notes = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const slug = entry.name;
    const noteDir = path.join(notesRoot, slug);
    const metaPath = path.join(noteDir, "content.json");

    let meta;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
    } catch {
      continue;
    }

    const files = await fs.readdir(noteDir);
    const unitFiles = files
      .filter((name) => UNIT_FILE_PATTERN.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const units = [];
    for (const fileName of unitFiles) {
      const num = fileName.slice(0, 2);
      const mdPath = path.join(noteDir, fileName);
      const md = await fs.readFile(mdPath, "utf8");
      const title = extractUnitTitle(md, `Unit ${num}`);

      units.push({
        id: num,
        num,
        title,
        clozeCount: countCloze(md),
        summaryHtml: renderMarkdownSummary(md),
        quizHtml: renderMarkdownQuiz(md),
      });
    }

    notes.push({
      slug,
      ...meta,
      units,
    });
  }

  return notes.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
}

function extractJsObject(source, name) {
  const pattern = new RegExp(`const\\s+${name}\\s*=\\s*`);
  const start = source.search(pattern);
  if (start === -1) return undefined;

  const openBrace = source.indexOf("{", start);
  if (openBrace === -1) return undefined;

  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escaped = false;

  for (let i = openBrace; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === stringQuote) inString = false;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openBrace, i + 1);
    }
  }

  return undefined;
}

function extractJsArray(source, name) {
  const pattern = new RegExp(`const\\s+${name}\\s*=\\s*\\[`);
  const start = source.search(pattern);
  if (start === -1) return undefined;

  const openBracket = source.indexOf("[", start);
  if (openBracket === -1) return undefined;

  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escaped = false;

  for (let i = openBracket; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === stringQuote) inString = false;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(openBracket, i + 1);
    }
  }

  return undefined;
}

export async function collectFlashcards(sourceDir) {
  const flashcardsRoot = path.join(sourceDir, "flashcards");
  const files = await fs.readdir(flashcardsRoot);
  const decks = [];

  for (const fileName of files) {
    if (!fileName.endsWith(".js")) continue;

    const slug = fileName.replace(/\.js$/, "");
    const filePath = path.join(flashcardsRoot, fileName);
    const source = await fs.readFile(filePath, "utf8");

    const metaLiteral = extractJsObject(source, "DECK_META");
    if (!metaLiteral) continue;

    const meta = Function(`"use strict"; return (${metaLiteral});`)();

    decks.push({
      slug,
      title: meta.title,
      subject: meta.subject,
      tags: meta.tags || [],
      updated: meta.updated || "",
      deckSource: source,
    });
  }

  return decks.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
}

/** Embed deck source verbatim from DECK_META onward (preserves arrow functions in FILTER_DEFS). */
export function sliceDeckScript(source) {
  const start = source.search(/const\s+DECK_META\s*=/);
  if (start === -1) return "";
  return source.slice(start).trim();
}

export function escapeInlineScript(js) {
  return js.replace(/<\/script/gi, "<\\/script");
}

export function parseDeckSource(source) {
  return escapeInlineScript(sliceDeckScript(source));
}
