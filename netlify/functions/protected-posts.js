"use strict";

/**
 * Netlify Function: protected-posts
 * Route: GET /api/protected-posts?site={id}
 * Returns metadata list of protected posts (no content, no password).
 * Returns [] silently if the site has no BASE_PROTECTED configured.
 */

const { listFiles, fetchRaw } = require("./_lib/github");
const { buildProtectedMeta } = require("./_lib/frontmatter");
const { CORS, handleOptions } = require("./_lib/cors");
const { REPO, getSite } = require("./_lib/config");

const caches = {};
const CACHE_TTL_MS = 60 * 1000;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const siteId = (event.queryStringParameters?.site || "").trim();
  const site = getSite(siteId);

  // Site has no protected posts — return empty list, not an error
  if (!site.BASE_PROTECTED) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify([]) };
  }

  const cached = caches[site.id];
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(cached.data),
    };
  }

  try {
    const files = await listFiles(REPO, site.BASE_PROTECTED);

    const metaList = (
      await Promise.all(
        files.map(async ({ path }) => {
          const slug = path
            .replace(`${site.BASE_PROTECTED}/`, "")
            .replace(/\.md$/i, "");
          const raw = await fetchRaw(REPO, site.BASE_PROTECTED, slug);
          return raw ? buildProtectedMeta(slug, raw) : null;
        }),
      )
    )
      .filter(Boolean)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    caches[site.id] = { data: metaList, cachedAt: Date.now() };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(metaList) };
  } catch (err) {
    console.error("[protected-posts]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch protected posts." }),
    };
  }
};
