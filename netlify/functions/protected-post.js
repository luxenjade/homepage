"use strict";

/**
 * Netlify Function: protected-post
 * Route: GET /api/protected-post?slug={slug}&password={raw_password}
 * Verifies password server-side against Supabase data.
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { SUPABASE_URL, SUPABASE_KEY } = require("./_lib/config");

const VALID_SLUG = /^[\w][\w/-]*$/;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  const slug = (event.queryStringParameters?.slug || "").trim();
  const password = (event.queryStringParameters?.password || "").trim();

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
    // Fetch post and password using resource embedding
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/private_posts?slug=eq.${encodeURIComponent(slug)}&select=*,posts_password(password)`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/vnd.pgrst.object+json",
        },
      },
    );

    if (res.status === 404) {
      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: "Invalid password or post not found." }),
      };
    }

    if (!res.ok) {
      throw new Error(`Supabase API ${res.status}: ${await res.text()}`);
    }

    const post = await res.json();

    // The embedded posts_password will be an object (or null if not found)
    const dbPassword = post.posts_password?.password;

    if (!dbPassword || dbPassword !== password) {
      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: "Invalid password or post not found." }),
      };
    }

    // Remove the password before returning
    delete post.posts_password;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(post),
    };
  } catch (err) {
    console.error("[protected-post]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch post from Supabase." }),
    };
  }
};
