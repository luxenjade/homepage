// netlify/edge-functions/admin-posts.ts
// GET /api/admin/posts
// Returns all posts from both tables with a `type` field.
// Requires X-Admin-Password header matching ADMIN_PASSWORD env var.

import {
  supabase,
  TABLES,
  handleOptions,
  jsonResponse,
  errorResponse,
} from "../lib/supabase.ts";

const ADMIN_PW = Netlify.env.get("ADMIN_PASSWORD") || "";

function checkAuth(request: Request): Response | null {
  if (request.method === "OPTIONS") return handleOptions(request);
  const pw = request.headers.get("X-Admin-Password") || "";
  if (!ADMIN_PW || pw !== ADMIN_PW) {
    return errorResponse("Unauthorized", 401);
  }
  return null;
}

export default async (request: Request) => {
  const auth = checkAuth(request);
  if (auth) return auth;

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
