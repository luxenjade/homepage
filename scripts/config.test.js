import { describe, it, expect, beforeAll, afterAll } from "vitest";

const URL_KEYS = ["SUPABASE_URL"];
const KEY_KEYS = ["SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PB_KEY"];

function snapshot(keys) {
  const out = {};
  for (const k of keys) out[k] = process.env[k];
  return out;
}

function restore(keys, snap) {
  for (const k of keys) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

// Ensure both required vars exist before the module is loaded anywhere.
const originalSnapshot = snapshot([...URL_KEYS, ...KEY_KEYS]);
process.env.SUPABASE_URL ??= "https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY ??= "sb_publishable_test_key";

async function loadConfig() {
  const url = `./config.js?cb=${Date.now()}-${Math.random()}`;
  return import(url);
}

describe("scripts/config.js", () => {
  let urlSnap;
  let keySnap;

  beforeAll(() => {
    urlSnap = snapshot(URL_KEYS);
    keySnap = snapshot(KEY_KEYS);
  });

  afterAll(() => {
    restore(URL_KEYS, urlSnap);
    restore(KEY_KEYS, keySnap);
    restore([...URL_KEYS, ...KEY_KEYS], originalSnapshot);
  });

  it("uses the default Supabase URL when SUPABASE_URL is not set", async () => {
    delete process.env.SUPABASE_URL;
    const mod = await loadConfig();
    expect(mod.SUPABASE_URL).toBe(
      "https://tasapyurqvkviblnaymt.supabase.co",
    );
  });

  it("reads SUPABASE_URL from the environment when provided", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    const mod = await loadConfig();
    expect(mod.SUPABASE_URL).toBe("https://example.supabase.co");
  });

  it("falls back to the legacy SUPABASE_PB_KEY alias", async () => {
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_PB_KEY = "sb_publishable_legacy";
    const mod = await loadConfig();
    expect(mod.SUPABASE_PUBLISHABLE_KEY).toBe("sb_publishable_legacy");
  });

  it("prefers SUPABASE_PUBLISHABLE_KEY over the legacy alias", async () => {
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_new";
    process.env.SUPABASE_PB_KEY = "sb_publishable_legacy";
    const mod = await loadConfig();
    expect(mod.SUPABASE_PUBLISHABLE_KEY).toBe("sb_publishable_new");
  });
});
