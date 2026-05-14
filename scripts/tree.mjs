import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const MAX_DEPTH = 3;
const IGNORE = new Set(["node_modules", ".git", "dist", ".next"]);

console.log(path.basename(ROOT) || ROOT);
await printTree(ROOT, 0, "");

async function printTree(dir, depth, prefix) {
  if (depth >= MAX_DEPTH) return;

  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => !IGNORE.has(entry.name))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const isLast = index === entries.length - 1;
    console.log(`${prefix}${isLast ? "`-- " : "|-- "}${entry.name}`);

    if (entry.isDirectory()) {
      const childPrefix = `${prefix}${isLast ? "    " : "|   "}`;
      await printTree(path.join(dir, entry.name), depth + 1, childPrefix);
    }
  }
}
