"use strict";

/**
 * Netlify Function: posts
 * Returns: { posts }
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { supabase, TABLES } = require("./_lib/config");

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  try {
    const { data: posts, error } = await supabase
      .from(TABLES.DOCS_PUBLIC)
      .select("slug,title,date,description,category,tags,thumbnail")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ posts }),
    };
  } catch (err) {
    console.error("[posts]", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to fetch posts from Supabase." }),
    };
  }
};
