#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "html-minifier-terser";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const sourceDir = path.join(projectRoot, "src/docs");
const outputDir = path.join(projectRoot, "dist/docs");

const requiredEntries = ["index.html", "post.html", "protected-post.html"];

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

async function minifyAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const loader = ext === ".css" ? "css" : "js";
  const source = await fs.readFile(filePath, "utf8");

  const result = await esbuild.transform(source, {
    charset: "utf8",
    legalComments: "none",
    loader,
    minify: true,
    target: loader === "js" ? "es2018" : undefined,
  });

  await fs.writeFile(filePath, result.code, "utf8");

  return {
    filePath,
    beforeBytes: Buffer.byteLength(source),
    afterBytes: Buffer.byteLength(result.code),
  };
}

async function minifyHtmlInDist() {
  const allFiles = await listFiles(outputDir);
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));

  for (const file of htmlFiles) {
    const input = await fs.readFile(file, "utf-8");
    const output = await minify(input, {
      collapseWhitespace: true,
      removeComments: true,
      conservativeCollapse: false, // 追加: 連続空白を1つに
      removeRedundantAttributes: true,
      removeEmptyAttributes: false,
      minifyCSS: true,
      minifyJS: true,
    });
    await fs.writeFile(file, output);
  }

  console.log(`  → ${htmlFiles.length} HTML files minified`);
}

export async function build() {
  await validateSource();

  console.log("[1/2] Cleaning dist/docs/ and copying src/docs/...");
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.cp(sourceDir, outputDir, { recursive: true });

  console.log("[2/2] Running esbuild on all JS/CSS in dist/docs/...");
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

  console.log("Minifying HTML in dist/docs/...");
  await minifyHtmlInDist();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
