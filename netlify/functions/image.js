"use strict";

/**
 * Netlify Function: image
 * Route: GET /api/image?path=451-docs/images/...
 * Proxies images from the private md-contents repo.
 */

const { fetchBinary } = require("./_lib/github");
const { handleOptions } = require("./_lib/cors");
const { REPO } = require("./_lib/config");

const { SITES } = require("./_lib/config");

// Dynamically allow <site-id>/images/ for all registered sites
const ALLOWED_PREFIXES = SITES.map((s) => `${s.id}/images/`);

// Only serve these extensions
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

const EXT_TO_MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getExt(filePath) {
  const i = filePath.lastIndexOf(".");
  return i === -1 ? "" : filePath.slice(i).toLowerCase();
}

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const raw = (event.queryStringParameters?.path || "").trim();

  // 1. Reject path traversal
  if (!raw || raw.includes("..") || raw.includes("//")) {
    return { statusCode: 400, body: "Invalid path." };
  }

  // 2. Normalize (no leading slash)
  const filePath = raw.startsWith("/") ? raw.slice(1) : raw;

  // 3. Enforce allowed prefix
  const allowed = ALLOWED_PREFIXES.some((p) => filePath.startsWith(p));
  if (!allowed) {
    return { statusCode: 403, body: "Forbidden." };
  }

  // 4. Enforce allowed extension
  const ext = getExt(filePath);
  if (!ALLOWED_EXT.has(ext)) {
    return { statusCode: 400, body: "Unsupported file type." };
  }

  try {
    const base64 = await fetchBinary(REPO, filePath);
    if (!base64) {
      return { statusCode: 404, body: "Image not found." };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": EXT_TO_MIME[ext],
        "Cache-Control": "public, max-age=86400", // 1日キャッシュ
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("[image]", err);
    return { statusCode: 502, body: "Failed to fetch image." };
  }
};
