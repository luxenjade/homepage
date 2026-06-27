import { describe, it, expect } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  injectPwaHeadSnippet,
  injectPwaHeadSnippetIntoFiles,
  injectAccessLogSnippet,
  injectAccessLogSnippetIntoFiles,
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
});
