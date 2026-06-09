import fs from "node:fs/promises";
import path from "node:path";
import { hexToLight } from "./html.mjs";

export async function loadSubjectColors(sourceDir) {
  const filePath = path.join(sourceDir, "subject-colors.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export function getSubjectColor(subjectColors, subject) {
  return subjectColors[subject] || subjectColors.default || "#2d6a4f";
}

export function buildSubjectColorsCss(subjectColors) {
  const lines = [
    "/* Generated at build time from subject-colors.json */",
    ":root {",
    `  --color-accent: ${subjectColors.default || "#2d6a4f"};`,
    `  --color-accent-light: ${hexToLight(subjectColors.default || "#2d6a4f")};`,
    "}",
  ];

  for (const [subject, color] of Object.entries(subjectColors)) {
    if (subject === "default") continue;
    lines.push(
      `[data-subject="${subject}"] { --card-color: ${color}; --unit-color: ${color}; --unit-color-light: ${hexToLight(color)}; }`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function buildSubjectStyleTag(subjectColors, subject) {
  const color = getSubjectColor(subjectColors, subject);
  const light = hexToLight(color);
  return `<style>:root { --unit-color: ${color}; --unit-color-light: ${light}; --color-accent: ${color}; --color-accent-light: ${light}; }</style>`;
}
