"use strict";

/**
 * Netlify Function: posts
 * Route: GET /api/posts   (site baked in via netlify.toml redirect query param)
 * Returns: { accent, accentDark, ui, posts }
 */

const { listFiles, fetchRaw } = require("./_lib/github");
const { buildMeta } = require("./_lib/frontmatter");
const { CORS, handleOptions } = require("./_lib/cors");
const { REPO, getSite } = require("./_lib/config");

const caches = {};
const CACHE_TTL_MS = 60 * 1000;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const siteId = (event.queryStringParameters?.site || "").trim();
  const site = getSite(siteId);

  const cached = caches[site.id];
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(cached.data),
    };
  }

  try {
    const files = await listFiles(REPO, site.BASE_PUBLIC);

    const posts = (
      await Promise.all(
        files.map(async ({ path }) => {
          const slug = path
            .replace(`${site.BASE_PUBLIC}/`, "")
            .replace(/\.md$/i, "");
          const raw = await fetchRaw(REPO, site.BASE_PUBLIC, slug);
          return raw ? buildMeta(slug, raw) : null;
        }),
      )
    )
      .filter(Boolean)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    const data = {
      accent: site.accent,
      accentDark: site.accentDark,
      ui: site.ui,
      posts,
    };

    caches[site.id] = { data, cachedAt: Date.now() };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    console.error("[posts]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch posts." }),
    };
  }
};
