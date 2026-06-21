// netlify/edge-functions/protected-post.ts
// Route: GET /api/protected-post?slug={slug}&password={raw_password}
// Verifies password server-side against Supabase data

import { supabase, TABLES, handleOptions, jsonResponse, errorResponse } from "../lib/supabase.ts";

const VALID_SLUG = /^[\w][\w\/-]*$/;

export default async (request: Request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const password = (url.searchParams.get("password") || "").trim();

  if (!slug || slug.includes("..") || !VALID_SLUG.test(slug)) {
    return errorResponse("Invalid or missing slug.", 400);
  }
  if (!password) {
    return errorResponse("Password required.", 400);
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
        return errorResponse("Invalid password or post not found.", 401);
      }
      throw error;
    }

    // The embedded password object
    const dbPassword = post[TABLES.DOCS_PASSWORD]?.password;

    if (!dbPassword || dbPassword !== password) {
      return errorResponse("Invalid password or post not found.", 401);
    }

    // Remove the password before returning
    delete post[TABLES.DOCS_PASSWORD];

    return jsonResponse(post);
  } catch (err) {
    console.error("[protected-post]", err);
    return errorResponse("Failed to fetch post from Supabase.", 502);
  }
};

export const config = { path: "/api/protected-post" };
