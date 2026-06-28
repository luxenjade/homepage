// netlify/edge-functions/sw.ts
// Route: POST /api/sw?path=...&ref=...
// Writes an access-log row to Supabase via the shared PostgREST helper.
// Uses SUPABASE_SECRET_KEY (service role) so client code cannot insert into
// `access_logs` directly. Falls back to publishable key if the secret is
// not configured (e.g. local dev).

import {
  SUPABASE_URL,
  insert,
  handleOptions,
  errorResponse,
} from "../lib/supabase.ts";

const PUBLISHABLE_FALLBACK_KEY =
  "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

function getSupabaseKey(): string {
  return Netlify.env.get("SUPABASE_SECRET_KEY") || PUBLISHABLE_FALLBACK_KEY;
}

export default async (request: Request, context: any) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";
  const referrer = url.searchParams.get("ref") || null;
  const userAgent = request.headers.get("user-agent") || null;
  const country = context?.geo?.country?.code || null;

  const SUPABASE_KEY = getSupabaseKey();

  // Use the shared `insert` helper from netlify/lib/supabase.ts so the URL,
  // auth headers, and parse-error handling stay in one place. The helper
  // hardcodes the service role key from Netlify.env; here we override by
  // passing through environment-derived key via a small wrapper below.
  const { error } = await insertWithKey("access_logs", SUPABASE_KEY, {
    path,
    referrer,
    user_agent: userAgent,
    country,
  });

  if (error) {
    console.error("[sw] insert failed:", error);
    return errorResponse("Log failed", 500);
  }

  return new Response("OK", { status: 200 });
};

// Local wrapper because the shared `insert` reads SUPABASE_KEY from the
// module scope of netlify/lib/supabase.ts. Keeping it as a thin shim here
// avoids exporting internal helpers from the shared module.
async function insertWithKey(
  table: string,
  key: string,
  body: Record<string, unknown>,
) {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    return { data: null, error: text || { message: response.statusText } };
  }
  return { data: null, error: null };
}

export const config = { path: "/api/sw" };
