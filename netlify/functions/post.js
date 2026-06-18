"use strict";

/**
 * Netlify Function: post
 * Route: GET /api/post?slug={slug}
 * Returns full post JSON including Markdown content from Supabase.
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { supabase, TABLES } = require("./_lib/config");

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
    const { data: post, error } = await supabase
      .from(TABLES.DOCS_PUBLIC)
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") { // No rows found
        return {
          statusCode: 404,
          headers: CORS,
          body: JSON.stringify({ error: "Post not found." }),
        };
      }
      throw error;
    }

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
