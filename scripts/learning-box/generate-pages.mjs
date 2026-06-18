import fs from "node:fs/promises";
import path from "node:path";
import {
  collectFlashcards,
  collectNotes,
  parseDeckSource,
} from "./lib/content.mjs";
import {
  escHtml,
  renderToolCard,
  replacePlaceholders,
} from "./lib/html.mjs";
import {
  buildSubjectColorsCss,
  buildSubjectStyleTag,
  getSubjectColor,
  loadSubjectColors,
} from "./lib/subject-colors.mjs";

function buildNavButtons(units) {
  return units
    .map(
      (unit, index) => `
      <button class="nav-unit-btn" id="nav-${unit.id}" onclick="navTo(${index})">
        <span class="nav-num">${escHtml(unit.num)}</span>
        <span class="nav-label">${escHtml(unit.title)}</span>
        <span class="nav-quiz-dot" id="navdot-${unit.id}"></span>
      </button>`,
    )
    .join("");
}

function buildUnitPanels(units) {
  return units
    .map((unit) => {
      const hidden = unit.id === units[0]?.id ? "block" : "none";
      return `
      <section class="unit-panel" data-unit-id="${escHtml(unit.id)}" style="display:${hidden}">
        <div class="tab-panel" id="panelSummary-${escHtml(unit.id)}" style="display:block">
          <div class="unit-header">
            <span class="unit-num">Unit ${escHtml(unit.num)}</span>
            <div>
              <h1 class="unit-title">${escHtml(unit.title)}</h1>
              <p class="unit-progress" id="unitProgress-${escHtml(unit.id)}">${unit.clozeCount > 0 ? `穴埋め ${unit.clozeCount}語` : ""}</p>
            </div>
          </div>
          <div class="markdown-body">${unit.summaryHtml}</div>
        </div>
        <div class="tab-panel" id="panelQuiz-${escHtml(unit.id)}" style="display:none">
          <div class="unit-header">
            <span class="unit-num">Unit ${escHtml(unit.num)}</span>
            <div>
              <h1 class="unit-title">${escHtml(unit.title)}</h1>
            </div>
          </div>
          <div class="quiz-wrap">${unit.quizHtml || `<p class="quiz-empty">このUnitには穴埋め（⟦⟦…⟧⟧）がありません。</p>`}</div>
        </div>
      </section>`;
    })
    .join("");
}

export async function generateSubjectColorsCss(sourceDir, outputDir) {
  const subjectColors = await loadSubjectColors(sourceDir);
  const css = buildSubjectColorsCss(subjectColors);
  await fs.mkdir(path.join(outputDir, "css"), { recursive: true });
  await fs.writeFile(path.join(outputDir, "css", "subject-colors.css"), css, "utf8");
  return subjectColors;
}

export async function generateIndex(sourceDir, outputDir, subjectColors) {
  const [notes, flashcards] = await Promise.all([
    collectNotes(sourceDir),
    collectFlashcards(sourceDir),
  ]);

  const template = await fs.readFile(path.join(sourceDir, "index.html"), "utf8");
  const noteCards = notes
    .map((note) =>
      renderToolCard(note, {
        href: `notes/${note.slug}.html`,
        badge: "Summary Note",
        color: getSubjectColor(subjectColors, note.subject),
      }),
    )
    .join("\n");

  const flashcardCards = flashcards
    .map((deck) =>
      renderToolCard(deck, {
        href: `flashcards/${deck.slug}.html`,
        badge: "Flashcards",
        color: getSubjectColor(subjectColors, deck.subject),
      }),
    )
    .join("\n");

  const html = replacePlaceholders(template, {
    TOTAL_COUNT: String(notes.length + flashcards.length),
    FLASHCARD_COUNT: String(flashcards.length),
    NOTE_COUNT: String(notes.length),
    FLASHCARD_CARDS: flashcardCards,
    NOTE_CARDS: noteCards,
  });

  await fs.writeFile(path.join(outputDir, "index.html"), html, "utf8");
  return { notes: notes.length, flashcards: flashcards.length };
}

export async function generateNotePages(sourceDir, outputDir, subjectColors, templateDir) {
  const notes = await collectNotes(sourceDir);
  const template = await fs.readFile(
    path.join(templateDir, "note-page.html"),
    "utf8",
  );
  const notesDir = path.join(outputDir, "notes");
  await fs.mkdir(notesDir, { recursive: true });

  for (const note of notes) {
    const unitsJson = JSON.stringify(
      note.units.map(({ id, num, title, clozeCount }) => ({
        id,
        num,
        title,
        clozeCount,
      })),
    );

    const html = replacePlaceholders(template, {
      TITLE: escHtml(note.title),
      SUBJECT: escHtml(note.subject),
      DESCRIPTION: escHtml(`${note.subject} — ${note.title}`),
      SUBJECT_STYLE: buildSubjectStyleTag(subjectColors, note.subject),
      NAV_BUTTONS: buildNavButtons(note.units),
      UNIT_PANELS: buildUnitPanels(note.units),
      UNITS_JSON: unitsJson,
    });

    await fs.writeFile(path.join(notesDir, `${note.slug}.html`), html, "utf8");
  }

  return notes.length;
}

export async function generateFlashcardPages(sourceDir, outputDir, subjectColors, templateDir) {
  const decks = await collectFlashcards(sourceDir);
  const template = await fs.readFile(
    path.join(templateDir, "flashcard-page.html"),
    "utf8",
  );
  const flashcardsDir = path.join(outputDir, "flashcards");
  await fs.mkdir(flashcardsDir, { recursive: true });

  for (const deck of decks) {
    const html = replacePlaceholders(template, {
      TITLE: escHtml(deck.title),
      SUBJECT: escHtml(deck.subject),
      DESCRIPTION: escHtml(`${deck.subject} — ${deck.title}`),
      SUBJECT_STYLE: buildSubjectStyleTag(subjectColors, deck.subject),
      DECK_SCRIPT: parseDeckSource(deck.deckSource),
    });

    await fs.writeFile(
      path.join(flashcardsDir, `${deck.slug}.html`),
      html,
      "utf8",
    );
  }

  return decks.length;
}
