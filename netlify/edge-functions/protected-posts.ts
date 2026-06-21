// netlify/edge-functions/protected-posts.ts
// Returns metadata list of protected posts from Supabase

import {
  supabase,
  TABLES,
  handleOptions,
  jsonResponse,
  errorResponse,
} from "../lib/supabase.ts";

export default async (request: Request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    const { data: posts, error } = await supabase
      .from(TABLES.DOCS_PRIVATE)
      .select("slug,title,date,excerpt,category,tags")
      .order("date", { ascending: false });

    if (error) throw error;

    return jsonResponse(posts);
  } catch (err) {
    console.error("[protected-posts]", err);
    return errorResponse("Failed to fetch protected posts from Supabase.", 502);
  }
};

export const config = { path: "/api/protected-posts" };
