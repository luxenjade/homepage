"use strict";

/**
 * Netlify Function: protected-post
 * Route: GET /api/protected-post?slug={slug}&password={raw_password}
 * Verifies password server-side against Supabase data.
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { supabase, TABLES } = require("./_lib/config");

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
    const { data: post, error } = await supabase
      .from(TABLES.DOCS_PRIVATE)
      .select(`*, ${TABLES.DOCS_PASSWORD}(password)`)
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          statusCode: 401,
          headers: CORS,
          body: JSON.stringify({ error: "Invalid password or post not found." }),
        };
      }
      throw error;
    }

    // The embedded password object
    const dbPassword = post[TABLES.DOCS_PASSWORD]?.password;

    if (!dbPassword || dbPassword !== password) {
      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: "Invalid password or post not found." }),
      };
    }

    // Remove the password before returning
    delete post[TABLES.DOCS_PASSWORD];

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
