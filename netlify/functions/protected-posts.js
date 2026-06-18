"use strict";

/**
 * Netlify Function: protected-posts
 * Returns metadata list of protected posts from Supabase.
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { supabase, TABLES } = require("./_lib/config");

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  try {
    const { data: posts, error } = await supabase
      .from(TABLES.DOCS_PRIVATE)
      .select("slug,title,date,excerpt,category,tags")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(posts),
    };
  } catch (err) {
    console.error("[protected-posts]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch protected posts from Supabase." }),
    };
  }
};
