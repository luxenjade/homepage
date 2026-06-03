import { describe, it, expect } from "vitest";
import { plainText, escapeHtml, isAbsolutePath } from "./utils.js";

describe("utils", () => {
  describe("plainText", () => {
    it("should remove HTML tags", () => {
      expect(plainText("<h1>Hello</h1>")).toBe("Hello");
    });

    it("should collapse multiple whitespaces", () => {
      expect(plainText("Hello   World")).toBe("Hello World");
    });
  });

  describe("escapeHtml", () => {
    it("should escape special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
    });
  });

  describe("isAbsolutePath", () => {
    it("should return true for absolute paths", () => {
      expect(isAbsolutePath("/path/to/file")).toBe(true);
      expect(isAbsolutePath("http://example.com")).toBe(true);
      expect(isAbsolutePath("https://example.com")).toBe(true);
    });

    it("should return false for relative paths", () => {
      expect(isAbsolutePath("path/to/file")).toBe(false);
      expect(isAbsolutePath("./path/to/file")).toBe(false);
      expect(isAbsolutePath("../path/to/file")).toBe(false);
    });
  });
});
