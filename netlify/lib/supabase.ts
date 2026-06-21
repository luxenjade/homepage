// netlify/lib/supabase.ts
// Shared lightweight PostgREST client for Edge Functions (Deno)
// NOTE: This file is intentionally placed OUTSIDE netlify/edge-functions/
// to avoid being bundled as an Edge Function by Netlify.

const SUPABASE_URL = "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SECRET_KEY");
export const TABLES = {
  DOCS_PUBLIC: "posts_public",
  DOCS_PRIVATE: "posts_private",
  DOCS_PASSWORD: "posts_password",
};

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

export function handleOptions(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return null;
}

class PostgrestQuery {
  private table: string;
  private params: URLSearchParams;
  private expectSingle: boolean;

  constructor(table: string) {
    this.table = table;
    this.params = new URLSearchParams();
    this.expectSingle = false;
  }

  select(columns: string) {
    this.params.set("select", columns);
    return this;
  }

  eq(column: string, value: string) {
    this.params.set(column, `eq.${value}`);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.params.set("order", `${column}.${ascending ? "asc" : "desc"}`);
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }

  async execute(): Promise<{ data: any; error: any }> {
    const url = new URL(`/rest/v1/${this.table}`, SUPABASE_URL);
    url.search = this.params.toString();

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: this.expectSingle
          ? "application/vnd.pgrst.object+json"
          : "application/json",
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return { data: null, error: body || { message: response.statusText } };
    }

    return { data: body, error: null };
  }
}

export const supabase = {
  from(table: string) {
    return new PostgrestQuery(table);
  },
};

export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

/* ── Auth helpers ──────────────────────────────────────── */

export async function verifyAuth(request: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = request.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  if (!jwt) {
    return { user: null, error: errorResponse("Unauthorized", 401) };
  }

  const res = await fetch(new URL("/auth/v1/user", SUPABASE_URL), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!res.ok) {
    return { user: null, error: errorResponse("Unauthorized", 401) };
  }

  const user = await res.json();
  return { user, error: null };
}

/* ── Write helpers ─────────────────────────────────────── */

export async function insert(
  table: string,
  body: any,
): Promise<{ data: any; error: any }> {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) return { data: null, error: data || { message: response.statusText } };
  return { data, error: null };
}

export async function update(
  table: string,
  column: string,
  value: string,
  body: any,
): Promise<{ data: any; error: any }> {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  url.searchParams.set(column, `eq.${value}`);
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) return { data: null, error: data || { message: response.statusText } };
  return { data, error: null };
}

export async function remove(
  table: string,
  column: string,
  value: string,
): Promise<{ error: any }> {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  url.searchParams.set(column, `eq.${value}`);
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) return { error: data || { message: response.statusText } };
  return { error: null };
}
