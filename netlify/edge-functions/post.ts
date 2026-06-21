// netlify/edge-functions/post.ts
// Route: GET /api/post?slug={slug}
// Returns full post JSON including Markdown content from Supabase

import { supabase, TABLES, handleOptions, jsonResponse, errorResponse } from "./supabase.ts";

const VALID_SLUG = /^[\w][\w\/-]*$/;

export default async (request: Request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim();

  if (!slug || slug.includes("..") || !VALID_SLUG.test(slug)) {
    return errorResponse("Invalid or missing slug.", 400);
  }

  try {
    const { data: post, error } = await supabase
      .from(TABLES.DOCS_PUBLIC)
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") { // No rows found
        return errorResponse("Post not found.", 404);
      }
      throw error;
    }

    return jsonResponse(post);
  } catch (err) {
    console.error("[post]", err);
    return errorResponse("Failed to fetch post from Supabase.", 502);
  }
};

export const config = { path: "/api/post" };
