import fs from "node:fs/promises";
import path from "node:path";
import { hexToLight } from "./html.mjs";

const DEFAULT_ACCENT = "#faba40";

function getOnAccentColor(hex) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const linear = [r, g, b].map((value) =>
    value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.42 ? "#3d2a00" : "#ffffff";
}

export async function loadSubjectColors(sourceDir) {
  const filePath = path.join(sourceDir, "subject-colors.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export function getSubjectColor(subjectColors, subject) {
  return subjectColors[subject] || subjectColors.default || DEFAULT_ACCENT;
}

export function buildSubjectColorsCss(subjectColors) {
  const defaultColor = subjectColors.default || DEFAULT_ACCENT;
  const lines = [
    "/* Generated at build time from subject-colors.json */",
    ":root {",
    `  --color-accent: ${defaultColor};`,
    `  --color-accent-light: ${hexToLight(defaultColor)};`,
    `  --color-on-accent: ${getOnAccentColor(defaultColor)};`,
    "}",
  ];

  for (const [subject, color] of Object.entries(subjectColors)) {
    if (subject === "default") continue;
    lines.push(
      `[data-subject="${subject}"] { --card-color: ${color}; --unit-color: ${color}; --unit-color-light: ${hexToLight(color)}; --color-on-accent: ${getOnAccentColor(color)}; }`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function buildSubjectStyleTag(subjectColors, subject) {
  const color = getSubjectColor(subjectColors, subject);
  const light = hexToLight(color);
  return `<style>:root { --unit-color: ${color}; --unit-color-light: ${light}; --color-accent: ${color}; --color-accent-light: ${light}; --color-on-accent: ${getOnAccentColor(color)}; }</style>`;
}
