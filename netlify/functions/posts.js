"use strict";

/**
 * Netlify Function: posts
 * Returns: { posts }
 */

const { CORS, handleOptions } = require("./_lib/cors");
const { SUPABASE_URL, SUPABASE_KEY, TABLES } = require("./_lib/config");

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLES.DOCS_PUBLIC}?select=slug,title,date,description,category,tags,thumbnail&order=date.desc`,
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

    const data = {
      posts,
    };

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data),
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
