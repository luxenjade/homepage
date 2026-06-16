"use strict";

/**
 * Netlify Function: protected-post
 * Route: GET /api/protected-post?slug={slug}&password={raw_password}&site={id}
 * Verifies password server-side. Never returns the password field.
 * Returns 404 if the site has no BASE_PROTECTED configured.
 */

const { fetchRaw } = require("./_lib/github");
const { buildProtectedPostData, checkPassword } = require("./_lib/frontmatter");
const { CORS, handleOptions } = require("./_lib/cors");
const { REPO, getSite } = require("./_lib/config");

const VALID_SLUG = /^[\w][\w/-]*$/;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const slug = (event.queryStringParameters?.slug || "").trim();
  const password = (event.queryStringParameters?.password || "").trim();
  const siteId = (event.queryStringParameters?.site || "").trim();
  const site = getSite(siteId);

  // Site has no protected posts
  if (!site.BASE_PROTECTED) {
    return {
      statusCode: 404,
      headers: CORS,
      body: JSON.stringify({ error: "This site has no protected posts." }),
    };
  }

  if (!slug || slug.includes("..") || !VALID_SLUG.test(slug)) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid or missing slug." }),
    };
  }
  if (!password) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Password required." }),
    };
  }

  try {
    const raw = await fetchRaw(REPO, site.BASE_PROTECTED, slug);

    if (!raw || !checkPassword(raw, password)) {
      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: "Invalid password or post not found." }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(buildProtectedPostData(slug, raw)),
    };
  } catch (err) {
    console.error("[protected-post]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch post." }),
    };
  }
};
