"use strict";

/**
 * Netlify Function: post
 * Route: GET /api/post?slug={slug}&site={id}
 * Returns full post JSON including Markdown content.
 */

const { fetchRaw } = require("./_lib/github");
const { buildPostData } = require("./_lib/frontmatter");
const { CORS, handleOptions } = require("./_lib/cors");
const { REPO, getSite } = require("./_lib/config");

const VALID_SLUG = /^[\w][\w/-]*$/;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const slug = (event.queryStringParameters?.slug || "").trim();
  const siteId = (event.queryStringParameters?.site || "").trim();
  const site = getSite(siteId);

  if (!slug || slug.includes("..") || !VALID_SLUG.test(slug)) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid or missing slug." }),
    };
  }

  try {
    const raw = await fetchRaw(REPO, site.BASE_PUBLIC, slug);
    if (!raw)
      return {
        statusCode: 404,
        headers: CORS,
        body: JSON.stringify({ error: "Post not found." }),
      };
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(buildPostData(slug, raw)),
    };
  } catch (err) {
    console.error("[post]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch post." }),
    };
  }
};
