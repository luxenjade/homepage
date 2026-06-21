// netlify/edge-functions/posts.ts
// Returns: { posts } — public post list from Supabase

import { supabase, TABLES, handleOptions, jsonResponse, errorResponse } from "../lib/supabase.ts";

export default async (request: Request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const { data: posts, error } = await supabase
      .from(TABLES.DOCS_PUBLIC)
      .select("slug,title,date,description,category,tags,thumbnail")
      .order("date", { ascending: false });

    if (error) throw error;

    return jsonResponse({ posts });
  } catch (err) {
    console.error("[posts]", err);
    return errorResponse("Failed to fetch posts from Supabase.", 502);
  }
};

export const config = { path: "/api/posts" };
