// netlify/lib/supabase.ts
// Shared lightweight PostgREST client for Edge Functions (Deno)
// NOTE: This file is intentionally placed OUTSIDE netlify/edge-functions/
// to avoid being bundled as an Edge Function by Netlify.

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = Netlify.env.get("SUPABASE_SECRET_KEY") || Netlify.env.get("SUPABASE_PB_KEY") || "";

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
        Accept: this.expectSingle ? "application/vnd.pgrst.object+json" : "application/json",
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
