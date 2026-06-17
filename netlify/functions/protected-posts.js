"use strict";

/**
 * Netlify Function: protected-posts
 * Returns metadata list of protected posts from Supabase.
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { SUPABASE_URL, SUPABASE_KEY } = require("./_lib/config");

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/private_posts?select=slug,title,date,excerpt,category&order=date.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Supabase API ${res.status}: ${await res.text()}`);
    }

    const posts = await res.json();

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
