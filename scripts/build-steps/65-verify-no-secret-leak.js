// 65-verify-no-secret-leak.js — クライアント bundle への秘密情報混入チェック
//
// dist/ 配下のファイルに service role key などが含まれていないか検査する。
// process.env 側では検査しない (Netlify は build と Edge Functions で
// env を共有するため、build 中にも SUPABASE_SECRET_KEY が存在する)。
//
// 検査方法:
//   1. process.env に SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY があれば取得
//   2. dist/ 内の全ファイルに対して、その値が含まれていないか grep
//   3. 混入していたらビルドを停止

import fs from "node:fs/promises";
import path from "node:path";
import { listFiles } from "../lib/build-common.js";

const SECRET_ENV_NAMES = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export async function run() {
  const secrets = SECRET_ENV_NAMES
    .map((name) => ({ name, value: process.env[name]?.trim() }))
    .filter((s) => s.value);

  if (secrets.length === 0) {
    console.log("  -> No service-role env vars set; skipping leak check.");
    return;
  }

  const files = (await listFiles("dist")).filter((file) =>
    /\.(js|css|html|json|xml|txt|webmanifest)$/i.test(file),
  );

  const offenders = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf8").catch(() => "");
    for (const { name, value } of secrets) {
      if (content.includes(value)) {
        offenders.push({ file, env: name });
      }
    }
  }

  if (offenders.length) {
    console.error(
      "❌ Service-role key leaked into client bundle. Aborting build.",
    );
    for (const { file, env } of offenders) {
      console.error(`  ${env} found in ${path.relative(process.cwd(), file)}`);
    }
    process.exit(1);
  }

  console.log(
    `  -> Secret leak check passed (${files.length} files scanned, ${secrets.length} key(s) excluded).`,
  );
}
