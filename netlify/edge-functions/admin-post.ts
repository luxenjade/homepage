// netlify/edge-functions/admin-post.ts
// POST /api/admin/post  → create
// PUT  /api/admin/post  → update (delete old + insert new)
// DELETE /api/admin/post?slug=xxx&type=yyy → delete
// Requires X-Admin-Password header matching ADMIN_PASSWORD env var.

import {
  TABLES,
  handleOptions,
  jsonResponse,
  errorResponse,
  insert,
  update as patch,
  remove,
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

function isPrivate(type: string) {
  return type === "private";
}

/* ── helpers ─────────────────────────────────────────── */

async function doInsert(table: string, body: any) {
  // Strip password field before inserting into post table
  const { password, ...rest } = body;
  return insert(table, rest);
}

async function doDelete(slug: string, type: string) {
  const table = isPrivate(type) ? TABLES.DOCS_PRIVATE : TABLES.DOCS_PUBLIC;
  const { error } = await remove(table, "slug", slug);
  if (error) return { error };
  if (isPrivate(type)) {
    await remove(TABLES.DOCS_PASSWORD, "slug", slug);
  }
  return { error: null };
}

async function doUpsert(oldSlug: string, oldType: string, body: any) {
  const newType = body.type || oldType;
  const isOldPrivate = isPrivate(oldType);
  const isNewPrivate = isPrivate(newType);

  // 1. Delete old record
  const { error: delErr } = await doDelete(oldSlug, oldType);
  if (delErr) return { error: delErr };

  // 2. Insert new record
  const table = isNewPrivate ? TABLES.DOCS_PRIVATE : TABLES.DOCS_PUBLIC;
  const { data, error: insErr } = await doInsert(table, body);
  if (insErr) return { error: insErr };

  // 3. Insert password if private
  if (isNewPrivate && body.password) {
    const { error: pwErr } = await insert(TABLES.DOCS_PASSWORD, {
      slug: body.slug,
      password: body.password,
    });
    if (pwErr) return { error: pwErr };
  }

  return { data, error: null };
}

async function doUpdateSameTable(slug: string, type: string, body: any) {
  const table = isPrivate(type) ? TABLES.DOCS_PRIVATE : TABLES.DOCS_PUBLIC;
  const { password, type: _type, slug: newSlug, ...updateBody } = body;

  // If slug is changing, we need to handle it carefully
  if (newSlug && newSlug !== slug) {
    // Slug change: delete old + insert new (simpler approach)
    return doUpsert(slug, type, body);
  }

  // Same slug: simple PATCH
  const { data, error } = await patch(table, "slug", slug, updateBody);
  if (error) return { error };

  // Update password if private
  if (isPrivate(type) && password !== undefined) {
    // Try to update existing password row
    const { error: pwErr } = await patch(TABLES.DOCS_PASSWORD, "slug", slug, {
      password,
    });
    if (pwErr) {
      // Row may not exist, insert instead
      await insert(TABLES.DOCS_PASSWORD, { slug, password });
    }
  }

  return { data, error: null };
}

/* ── handlers ─────────────────────────────────────────── */

async function handleCreate(request: Request): Promise<Response> {
  const body = await request.json();
  if (!body.slug || !body.title) {
    return errorResponse("slug and title are required", 400);
  }

  const type = body.type || "public";
  const table = isPrivate(type) ? TABLES.DOCS_PRIVATE : TABLES.DOCS_PUBLIC;

  const { data, error } = await doInsert(table, body);
  if (error) {
    console.error("[admin-post] create error:", error);
    return errorResponse(error.message || "Create failed", 502);
  }

  // Insert password if private
  if (isPrivate(type) && body.password) {
    const { error: pwErr } = await insert(TABLES.DOCS_PASSWORD, {
      slug: body.slug,
      password: body.password,
    });
    if (pwErr) {
      console.error("[admin-post] password insert error:", pwErr);
    }
  }

  return jsonResponse({ data, type }, 201);
}

async function handleUpdate(request: Request): Promise<Response> {
  const body = await request.json();
  const { oldSlug, oldType, ...newData } = body;

  if (!oldSlug) {
    return errorResponse("oldSlug is required", 400);
  }

  const type = oldType || "public";
  const newType = newData.type || type;

  // If type changed, must delete+insert across tables
  if (type !== newType) {
    const { data, error } = await doUpsert(oldSlug, type, newData);
    if (error) {
      console.error("[admin-post] upsert error:", error);
      return errorResponse(error.message || "Update failed", 502);
    }
    return jsonResponse({ data, type: newType });
  }

  // Same type: try PATCH first
  const { data, error } = await doUpdateSameTable(oldSlug, type, newData);
  if (error) {
    console.error("[admin-post] update error:", error);
    return errorResponse(error.message || "Update failed", 502);
  }
  return jsonResponse({ data, type });
}

async function handleDelete(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const type = url.searchParams.get("type") || "public";

  if (!slug) {
    return errorResponse("slug is required", 400);
  }

  const { error } = await doDelete(slug, type);
  if (error) {
    console.error("[admin-post] delete error:", error);
    return errorResponse(error.message || "Delete failed", 502);
  }
  return jsonResponse({ success: true });
}

/* ── main ────────────────────────────────────────────── */

export default async (request: Request) => {
  const auth = checkAuth(request);
  if (auth) return auth;

  switch (request.method) {
    case "POST":
      return handleCreate(request);
    case "PUT":
      return handleUpdate(request);
    case "DELETE":
      return handleDelete(request);
    default:
      return errorResponse("Method not allowed", 405);
  }
};

export const config = { path: "/api/admin/post" };
