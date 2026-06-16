#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { minify } from "html-minifier-terser";
import esbuild from "esbuild";
import { fileURLToPath } from "node:url";
import {
  generateFlashcardPages,
  generateIndex,
  generateNotePages,
  generateSubjectColorsCss,
} from "./generate-pages.mjs";
import { generateManifest, generateServiceWorker } from "./lib/pwa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "../..");
const sourceDir = path.join(projectRoot, "src/learning-box");
const outputDir = path.join(projectRoot, "dist/learning-box");
const templateDir = path.join(projectRoot, "template/learning-box");

const requiredEntries = ["index.html"];

/** Paths under src/ that are published to dist/ (content sources are excluded). */
const DEPLOY_DIRS = ["css", "images"];
const DEPLOY_ROOT_FILES = [];
const DEPLOY_JS_FILES = ["note-static.js", "flashcard-app.js", "pwa.js"];

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function validateSource() {
  if (!(await pathExists(sourceDir))) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  await Promise.all(
    requiredEntries.map(async (relativePath) => {
      const fullPath = path.join(sourceDir, relativePath);
      if (!(await pathExists(fullPath))) {
        throw new Error(`Missing required source file: ${relativePath}`);
      }
    }),
  );
}

function isLeakedDeployPath(relativePath) {
  if (relativePath.endsWith(".md")) return true;
  if (relativePath.endsWith("content.json")) return true;
  if (relativePath === "subject-colors.json") return true;
  if (/^notes\/[^/]+\/.+/.test(relativePath)) return true;
  if (/^flashcards\/[^/]+\.js$/.test(relativePath)) return true;
  if (relativePath === "js/note-app.js") return true;
  if (relativePath === "note.html" || relativePath === "flashcard.html") return true;
  return false;
}

async function assertNoSourceLeakage() {
  const files = await listFiles(outputDir);
  const leaked = files
    .map((file) => path.relative(outputDir, file).replace(/\\/g, "/"))
    .filter(isLeakedDeployPath);

  if (leaked.length) {
    throw new Error(
      `Source files must not be published in dist:\n${leaked.join("\n")}`,
    );
  }
}

async function copyDeployableAssets() {
  for (const dir of DEPLOY_DIRS) {
    const from = path.join(sourceDir, dir);
    if (!(await pathExists(from))) continue;
    await fs.cp(from, path.join(outputDir, dir), { recursive: true });
  }

  const jsOut = path.join(outputDir, "js");
  await fs.mkdir(jsOut, { recursive: true });
  for (const file of DEPLOY_JS_FILES) {
    const from = path.join(sourceDir, "js", file);
    if (!(await pathExists(from))) {
      throw new Error(`Missing deployable script: src/js/${file}`);
    }
    await fs.copyFile(from, path.join(jsOut, file));
  }

  for (const file of DEPLOY_ROOT_FILES) {
    const from = path.join(sourceDir, file);
    if (!(await pathExists(from))) continue;
    await fs.copyFile(from, path.join(outputDir, file));
  }
}

async function minifyAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const loader = ext === ".css" ? "css" : "js";
  const source = await fs.readFile(filePath, "utf8");

  const result = await esbuild.transform(source, {
    charset: "utf8",
    legalComments: "none",
    loader,
    minify: true,
    target: loader === "js" ? "esnext" : undefined,
  });

  await fs.writeFile(filePath, result.code, "utf8");

  return {
    filePath,
    beforeBytes: Buffer.byteLength(source),
    afterBytes: Buffer.byteLength(result.code),
  };
}

function isFlashcardHtml(filePath) {
  return filePath.includes(`${path.sep}flashcards${path.sep}`);
}

async function minifyHtmlInDist() {
  const allFiles = await listFiles(outputDir);
  const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));

  for (const file of htmlFiles) {
    const input = await fs.readFile(file, "utf-8");
    const output = await minify(input, {
      collapseWhitespace: true,
      removeComments: true,
      conservativeCollapse: false,
      removeRedundantAttributes: true,
      removeEmptyAttributes: false,
      minifyCSS: true,
      // Inline deck scripts must not be minified (FILTER_DEFS arrow functions, large CARDS).
      minifyJS: !isFlashcardHtml(file),
    });
    await fs.writeFile(file, output);
  }

  console.log(`  → ${htmlFiles.length} HTML files minified`);
}

async function assertFlashcardPagesHaveDeckData() {
  const flashcardsDir = path.join(outputDir, "flashcards");
  if (!(await pathExists(flashcardsDir))) return;

  const entries = await fs.readdir(flashcardsDir);
  const missing = [];

  for (const name of entries) {
    if (!name.endsWith(".html")) continue;
    const html = await fs.readFile(path.join(flashcardsDir, name), "utf8");
    if (!html.includes("const CARDS") || html.includes("DECK_SCRIPT")) {
      missing.push(name);
    }
  }

  if (missing.length) {
    throw new Error(
      `Flashcard pages missing embedded deck data: ${missing.join(", ")}`,
    );
  }
}

export async function build() {
  await validateSource();

  console.log("[1/6] Cleaning dist/learning-box/ and copying deployable assets...");
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await copyDeployableAssets();

  console.log("[2/6] Generating subject colors CSS and web manifest...");
  const subjectColors = await generateSubjectColorsCss(sourceDir, outputDir);
  await generateManifest(sourceDir, outputDir);

  console.log("[3/6] Generating index and content pages...");
  const indexStats = await generateIndex(sourceDir, outputDir, subjectColors);
  const noteCount = await generateNotePages(sourceDir, outputDir, subjectColors, templateDir);
  const flashcardCount = await generateFlashcardPages(
    sourceDir,
    outputDir,
    subjectColors,
    templateDir
  );
  console.log(
    `  → index (${indexStats.flashcards} flashcards, ${indexStats.notes} notes), ${noteCount} note pages, ${flashcardCount} flashcard pages`,
  );

  console.log("[4/6] Running esbuild on all JS/CSS in dist/learning-box/...");
  const copiedFiles = await listFiles(outputDir);
  const assetFiles = copiedFiles.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".js" || ext === ".css";
  });
  const minifiedAssets = await Promise.all(assetFiles.map(minifyAsset));

  const files = await listFiles(outputDir);
  const stats = await Promise.all(files.map((file) => fs.stat(file)));
  const totalBytes = stats.reduce((sum, stat) => sum + stat.size, 0);
  const beforeBytes = minifiedAssets.reduce(
    (sum, asset) => sum + asset.beforeBytes,
    0,
  );
  const afterBytes = minifiedAssets.reduce(
    (sum, asset) => sum + asset.afterBytes,
    0,
  );
  const savings = beforeBytes - afterBytes;

  console.log(
    `Minified ${minifiedAssets.length} assets in ${path.relative(
      projectRoot,
      outputDir,
    )} (${formatBytes(beforeBytes)} -> ${formatBytes(
      afterBytes,
    )}, saved ${formatBytes(savings)}).`,
  );
  console.log(
    `Built ${files.length} files from ${path.relative(
      projectRoot,
      sourceDir,
    )} to ${path.relative(projectRoot, outputDir)} (${formatBytes(
      totalBytes,
    )} total).`,
  );

  console.log("[5/6] Minifying HTML...");
  await minifyHtmlInDist();

  console.log("[6/6] Generating service worker...");
  const precacheCount = await generateServiceWorker(outputDir);
  console.log(`  → ${precacheCount} URLs precached`);

  await assertFlashcardPagesHaveDeckData();
  await assertNoSourceLeakage();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

