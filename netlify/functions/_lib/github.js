"use strict";

/**
 * _lib/github.js
 * GitHub Contents API wrapper shared by all Netlify Functions.
 */

const API = "https://api.github.com";

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * List all .md files under basePath, recursively.
 * Returns array of { name, path } where path is repo-root-relative.
 */
async function listFiles(repo, basePath) {
  const res = await fetch(
    `${API}/repos/${repo}/contents/${basePath}?ref=main`,
    { headers: ghHeaders() },
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);

  const items = await res.json();
  const results = [];

  for (const item of items) {
    if (item.type === "file" && item.name.endsWith(".md")) {
      results.push({ name: item.name, path: item.path });
    } else if (item.type === "dir") {
      results.push(...(await listFiles(repo, item.path)));
    }
  }
  return results;
}

/**
 * Fetch raw Markdown for a given slug (may contain slashes for subfolders).
 * Returns null if not found.
 */
async function fetchRaw(repo, basePath, slug) {
  const res = await fetch(
    `${API}/repos/${repo}/contents/${basePath}/${slug}.md?ref=main`,
    { headers: ghHeaders() },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.content, "base64").toString("utf-8");
}

/**
 * Fetch a binary file (e.g. image) from the repo.
 * Returns { base64, contentType } or null if not found.
 */
async function fetchBinary(repo, filePath) {
  const res = await fetch(
    `${API}/repos/${repo}/contents/${filePath}?ref=main`,
    { headers: ghHeaders() },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  // GitHub API always returns base64; strip embedded newlines
  return json.content.replace(/\n/g, "");
}

module.exports = { listFiles, fetchRaw, fetchBinary };
