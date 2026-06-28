import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

async function loadStep() {
  const url = `./65-verify-no-secret-leak.js?cb=${Date.now()}-${Math.random()}`;
  return import(url);
}

describe("scripts/build-steps/65-verify-no-secret-leak.js", () => {
  let cwd;

  beforeEach(async () => {
    cwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(cwd);
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.restoreAllMocks();
  });

  it("skips scan when no secret env vars are set", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "leak-skip-"));
    await mkdir(path.join(tempDir, "dist"), { recursive: true });
    await writeFile(
      path.join(tempDir, "dist", "index.html"),
      "<html></html>",
    );
    process.chdir(tempDir);

    const step = await loadStep();
    const log = vi.spyOn(console, "log").mockImplementation(() => { });
    await step.run();

    expect(
      log.mock.calls.some((c) => String(c[0]).includes("skipping leak check")),
    ).toBe(true);
  });

  it("passes when the secret is not present in dist files", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "leak-pass-"));
    await mkdir(path.join(tempDir, "dist"), { recursive: true });
    await writeFile(
      path.join(tempDir, "dist", "app.js"),
      'const safe = "hello";',
    );
    process.env.SUPABASE_SECRET_KEY = "sb_secret_TEST_MARKER_12345";
    process.chdir(tempDir);

    const step = await loadStep();
    const log = vi.spyOn(console, "log").mockImplementation(() => { });
    await step.run();

    expect(
      log.mock.calls.some((c) =>
        String(c[0]).includes("Secret leak check passed"),
      ),
    ).toBe(true);
  });

  it("aborts when the secret is found in a dist file", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "leak-fail-"));
    await mkdir(path.join(tempDir, "dist"), { recursive: true });
    const secret = "sb_secret_TEST_MARKER_LEAKED";
    process.env.SUPABASE_SECRET_KEY = secret;
    await writeFile(
      path.join(tempDir, "dist", "leak.js"),
      `const leaked = "${secret}";`,
    );
    process.chdir(tempDir);

    const step = await loadStep();
    vi.spyOn(console, "error").mockImplementation(() => { });
    vi.spyOn(console, "log").mockImplementation(() => { });
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation(() => {
        throw new Error("process.exit");
      });

    await expect(step.run()).rejects.toThrow(/process\.exit/);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
