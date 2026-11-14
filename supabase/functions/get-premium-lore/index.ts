import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function reply(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return reply(401, { error: "login_required", message: "Нэвтэрч орно уу." });
  }

  let slug = "";
  try {
    const body = await req.json();
    slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  } catch {
    return reply(400, { error: "invalid_json" });
  }

  if (!/^[a-z0-9][a-z0-9-]{1,90}$/.test(slug)) {
    return reply(400, { error: "invalid_slug" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return reply(503, { error: "server_not_configured" });
  }

  const token = authorization.slice("Bearer ".length);
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return reply(401, { error: "invalid_session", message: "Дахин нэвтэрнэ үү." });
  }

  const { data: membership, error: membershipError } = await client
    .from("gmn_memberships")
    .select("status, starts_at, expires_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (membershipError) return reply(503, { error: "membership_check_failed" });

  const now = Date.now();
  const active = membership?.status === "active"
    && membership.starts_at
    && membership.expires_at
    && new Date(membership.starts_at).getTime() <= now
    && new Date(membership.expires_at).getTime() > now;

  if (!active) {
    return reply(403, {
      error: "premium_required",
      message: "Энэ судалгааг уншихын тулд идэвхтэй Premium эрх шаардлагатай.",
    });
  }

  const { data: article, error: articleError } = await client
    .from("gmn_premium_lore_index")
    .select("slug, game, title, teaser")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (articleError) return reply(503, { error: "article_lookup_failed" });
  if (!article) return reply(404, { error: "article_not_found" });

  const { data: content, error: contentError } = await client
    .from("gmn_premium_lore_content")
    .select("body_markdown, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (contentError) return reply(503, { error: "content_lookup_failed" });
  if (!content) return reply(404, { error: "article_content_not_found" });

  return reply(200, {
    article,
    body_markdown: content.body_markdown,
    updated_at: content.updated_at,
    membership_expires_at: membership.expires_at,
  });
});
