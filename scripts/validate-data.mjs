import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { InnerLinkConfigSchema, ExternalLinkConfigSchema } from "./schemas.js";

const ROOT = process.cwd();
const INNER_LINKS_ROOT = join(ROOT, "inner_links");
const EXTERNAL_LINKS_ROOT = join(ROOT, "external_links");

function validateFiles(dir, schema, label) {
  if (!existsSync(dir)) return true;

  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  let allValid = true;

  console.log(`Validating ${label}...`);
  for (const file of files) {
    const fullPath = join(dir, file);
    const relativePath = relative(ROOT, fullPath);
    try {
      const data = JSON.parse(readFileSync(fullPath, "utf8"));
      const result = schema.safeParse(data);
      if (!result.success) {
        console.error(`❌ Validation failed for ${relativePath}:`);
        console.error(result.error.format());
        allValid = false;
      } else {
        console.log(`✅ ${relativePath} is valid.`);
      }
    } catch (e) {
      console.error(`❌ Error parsing ${relativePath}:`, e.message);
      allValid = false;
    }
  }
  return allValid;
}

const innerValid = validateFiles(INNER_LINKS_ROOT, InnerLinkConfigSchema, "Inner Links");
const externalValid = validateFiles(EXTERNAL_LINKS_ROOT, ExternalLinkConfigSchema, "External Links");

if (!innerValid || !externalValid) {
  process.exit(1);
}
