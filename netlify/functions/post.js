"use strict";

/**
 * Netlify Function: post
 * Route: GET /api/post?slug={slug}
 * Returns full post JSON including Markdown content from Supabase.
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { SUPABASE_URL, SUPABASE_KEY } = require("./_lib/config");

const VALID_SLUG = /^[\w][\w/-]*$/;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const slug = (event.queryStringParameters?.slug || "").trim();

  if (!slug || slug.includes("..") || !VALID_SLUG.test(slug)) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid or missing slug." }),
    };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/public_posts?slug=eq.${encodeURIComponent(slug)}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/vnd.pgrst.object+json", // Get a single object, not an array
        },
      },
    );

    if (res.status === 404) {
      return {
        statusCode: 404,
        headers: CORS,
        body: JSON.stringify({ error: "Post not found." }),
      };
    }

    if (!res.ok) {
      throw new Error(`Supabase API ${res.status}: ${await res.text()}`);
    }

    const post = await res.json();
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(post),
    };
  } catch (err) {
    console.error("[post]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch post from Supabase." }),
    };
  }
};
