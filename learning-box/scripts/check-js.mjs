import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TARGET_DIRS = ["scripts", "src", "netlify"]
  .map((dir) => resolve(ROOT, dir))
  .filter((dir) => existsSync(dir) && statSync(dir).isDirectory());
const IGNORE_DIRS = new Set([".git", "node_modules", "archives", "dist"]);
const JS_EXTENSIONS = new Set([".js", ".mjs"]);

function collectJsFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files.push(...collectJsFiles(join(dir, entry.name)));
      }
      continue;
    }

    const extension = extname(entry.name);
    if (entry.isFile() && JS_EXTENSIONS.has(extension)) {
      files.push(join(dir, entry.name));
    }
  }

  return files;
}

const jsFiles = TARGET_DIRS.flatMap((dir) => collectJsFiles(dir));
if (!jsFiles.length) {
  console.log("No JS files found.");
  process.exit(0);
}

let hasError = false;
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    hasError = true;
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
  }
}

if (hasError) {
  console.error("JavaScript syntax check failed.");
  process.exit(1);
}

console.log(`JavaScript syntax check passed for ${jsFiles.length} files.`);
