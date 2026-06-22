// 25-nav-config.js — src/nav-config.json を dist/js/nav.js に反映
import fs from "node:fs/promises";
import { pathExists } from "../lib/build-common.js";

const NAV_CONFIG_PATH = "src/nav-config.json";
const NAV_JS_PATH = "dist/js/nav.js";

export async function run() {
  if (!(await pathExists(NAV_CONFIG_PATH))) {
    console.log("  -> nav-config.json not found, using default nav links.");
    return;
  }

  const configRaw = await fs.readFile(NAV_CONFIG_PATH, "utf8");
  const config = JSON.parse(configRaw);

  if (!config.links || !Array.isArray(config.links)) {
    console.warn("  -> nav-config.json has no 'links' array, using defaults.");
    return;
  }

  const navJs = await fs.readFile(NAV_JS_PATH, "utf8");

  // NAV_LINKS 配列定義を置換する
  const linksLiteral = config.links
    .map((link) => `    { href: "${link.href}", label: "${link.label}" },`)
    .join("\n");

  const newNavLinks = `  const NAV_LINKS = [\n${linksLiteral}\n  ];`;

  const replaced = navJs.replace(
    /^\s*const NAV_LINKS = \[\s*\n[\s\S]*?\n\s*\];/m,
    newNavLinks,
  );

  if (replaced === navJs) {
    console.warn("  -> NAV_LINKS replacement did not match; nav.js may have changed.");
    return;
  }

  await fs.writeFile(NAV_JS_PATH, replaced, "utf8");
  console.log(`  -> Injected ${config.links.length} nav links from nav-config.json.`);
}
