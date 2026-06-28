import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  injectPwaHeadSnippet,
  injectPwaHeadSnippetIntoFiles,
  injectAccessLogSnippet,
  injectAccessLogSnippetIntoFiles,
  collectPrecacheEntries,
  writePrecacheManifest,
  injectShellAssetsList,
} from "./build-common.js";

describe("build-common", () => {
  it("injects the PWA head snippet before the closing head tag", () => {
    const input = "<html><head><meta charset=\"utf-8\" /></head><body></body></html>";
    const output = injectPwaHeadSnippet(input);

    expect(output).toContain('<link rel="manifest" href="/manifest.json" />');
    expect(output).toContain('<meta name="theme-color" content="#faba40" />');
    expect(output).toMatch(/<meta charset="utf-8" \/>\s*<link rel="manifest"/);
  });

  it("does not duplicate the PWA head snippet when it already exists", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "pwa-snippet-"));
    const filePath = path.join(tempDir, "index.html");
    const html = '<html><head><link rel="manifest" href="/manifest.json" /><meta name="theme-color" content="#faba40" /></head><body></body></html>';

    try {
      await writeFile(filePath, html, "utf8");
      await injectPwaHeadSnippetIntoFiles([filePath]);
      const output = await readFile(filePath, "utf8");

      expect(output.match(/<link rel="manifest" href="\/manifest.json" \/>/g)).toHaveLength(1);
      expect(output.match(/<meta name="theme-color" content="#faba40" \/>/g)).toHaveLength(1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("injects the access log snippet before the closing body tag", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "access-log-snippet-"));
    const filePath = path.join(tempDir, "index.html");
    const html = "<html><body><main>hello</main></body></html>";

    try {
      await writeFile(filePath, html, "utf8");
      await injectAccessLogSnippetIntoFiles([filePath]);
      const output = await readFile(filePath, "utf8");

      expect(output).toContain("navigator.sendBeacon");
      expect(output).toContain("window.hasSentAccessLog");
      expect(output).toMatch(/<main>hello<\/main>\s*<script>/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe("precache manifest", () => {
    async function setupFixture() {
      const tempDir = await mkdtemp(path.join(tmpdir(), "precache-"));
      await mkdir(path.join(tempDir, "css"), { recursive: true });
      await mkdir(path.join(tempDir, "images"), { recursive: true });
      await mkdir(path.join(tempDir, "api"), { recursive: true });

      await writeFile(path.join(tempDir, "index.html"), "<html></html>");
      await writeFile(path.join(tempDir, "manifest.json"), "{}");
      await writeFile(path.join(tempDir, "css", "base.css"), "body{}");
      await writeFile(path.join(tempDir, "images", "favicon.png"), "png");
      await writeFile(
        path.join(tempDir, "api", "posts.js"),
        "should-be-skipped",
      );
      await writeFile(path.join(tempDir, "notes.txt"), "not precacheable");

      return tempDir;
    }

    it("collects cacheable assets from a dist tree and skips api/ and unknown extensions", async () => {
      const tempDir = await setupFixture();
      try {
        const urls = await collectPrecacheEntries(tempDir);

        // Required roots
        expect(urls).toContain("/");
        expect(urls).toContain("/index.html");
        expect(urls).toContain("/manifest.json");
        // Walked assets
        expect(urls).toContain("/css/base.css");
        expect(urls).toContain("/images/favicon.png");
        // Skipped
        expect(urls).not.toContain("/api/posts.js");
        expect(urls).not.toContain("/notes.txt");
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it("writes a cache-manifest.js exporting PRECACHE_URLS", async () => {
      const tempDir = await setupFixture();
      const outputPath = path.join(tempDir, "cache-manifest.js");
      try {
        const urls = await writePrecacheManifest({
          distDir: tempDir,
          outputPath,
        });
        const content = await readFile(outputPath, "utf8");

        expect(content).toContain("AUTO-GENERATED");
        expect(content).toMatch(/export const PRECACHE_URLS =/);
        expect(urls.length).toBeGreaterThan(0);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it("injects SHELL_ASSETS placeholder into the service worker source", async () => {
      const tempDir = await mkdtemp(path.join(tmpdir(), "sw-inject-"));
      const swPath = path.join(tempDir, "service-worker.js");
      try {
        await writeFile(
          swPath,
          'const SHELL_ASSETS = __SHELL_ASSETS__;\nself.addEventListener("install", () => {});',
        );

        const ok = await injectShellAssetsList({
          swPath,
          urls: ["/", "/index.html", "/css/base.css"],
        });
        const content = await readFile(swPath, "utf8");

        expect(ok).toBe(true);
        expect(content).not.toContain("__SHELL_ASSETS__");
        expect(content).toContain('"/"');
        expect(content).toContain('"/css/base.css"');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it("returns false when the placeholder is missing", async () => {
      const tempDir = await mkdtemp(path.join(tmpdir(), "sw-inject-"));
      const swPath = path.join(tempDir, "service-worker.js");
      try {
        await writeFile(swPath, "const SHELL_ASSETS = ['/'];");
        const ok = await injectShellAssetsList({ swPath, urls: ["/"] });
        expect(ok).toBe(false);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
