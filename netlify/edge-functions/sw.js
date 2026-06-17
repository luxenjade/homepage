export default async (request, context) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";
  const referrer = url.searchParams.get("ref") || null;
  const userAgent = request.headers.get("user-agent") || null;
  const country = context.geo?.country?.code || null;

  const SUPABASE_URL = "https://tasapyurqvkviblnaymt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ path, referrer, user_agent: userAgent, country }),
  });

  if (!res.ok) {
    return new Response("Log failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
};

export const config = { path: "/api/sw" };
