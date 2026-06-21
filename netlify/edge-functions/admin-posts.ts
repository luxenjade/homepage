// netlify/edge-functions/admin-posts.ts
// GET /api/admin/posts
// Returns all posts from both tables with a `type` field.
// Requires a valid Supabase Auth JWT in the Authorization header.

import {
  supabase,
  TABLES,
  handleOptions,
  jsonResponse,
  errorResponse,
  verifyAuth,
} from "../lib/supabase.ts";

export default async (request: Request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const { error: authError } = await verifyAuth(request);
  if (authError) return authError;

  try {
    const [{ data: publicPosts }, { data: privatePosts }] = await Promise.all([
      supabase
        .from(TABLES.DOCS_PUBLIC)
        .select("*")
        .order("date", { ascending: false }),
      supabase
        .from(TABLES.DOCS_PRIVATE)
        .select("*")
        .order("date", { ascending: false }),
    ]);

    const posts = [
      ...(publicPosts || []).map((p: any) => ({ ...p, type: "public" })),
      ...(privatePosts || []).map((p: any) => ({ ...p, type: "private" })),
    ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return jsonResponse({ posts });
  } catch (err) {
    console.error("[admin-posts]", err);
    return errorResponse("Failed to fetch posts", 502);
  }
};

export const config = { path: "/api/admin/posts" };
