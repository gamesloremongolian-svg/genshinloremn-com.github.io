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
    return reply(401, { error: "login_required" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return reply(503, { error: "server_not_configured" });
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return reply(401, { error: "invalid_session" });

  let targetUserId = "";
  try {
    const body = await req.json();
    targetUserId = typeof body?.user_id === "string" ? body.user_id.trim() : "";
  } catch {
    return reply(400, { error: "invalid_json" });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return reply(400, { error: "invalid_user_id" });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Only users explicitly listed in public.wiki_admins may grant memberships.
  const { data: adminRow, error: adminError } = await adminClient
    .from("wiki_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return reply(503, { error: "admin_check_failed" });
  if (!adminRow) return reply(403, { error: "admin_only" });

  const { data: existing, error: lookupError } = await adminClient
    .from("gmn_memberships")
    .select("status, starts_at, expires_at")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (lookupError) return reply(503, { error: "membership_lookup_failed" });

  const now = new Date();
  const oldExpiry = existing?.expires_at ? new Date(existing.expires_at) : null;
  const stillActive = existing?.status === "active" && oldExpiry && oldExpiry.getTime() > now.getTime();
  const startsAt = stillActive && existing?.starts_at ? existing.starts_at : now.toISOString();
  const base = oldExpiry && oldExpiry.getTime() > now.getTime() ? oldExpiry : now;
  const expiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: saveError } = await adminClient
    .from("gmn_memberships")
    .upsert({
      user_id: targetUserId,
      status: "active",
      starts_at: startsAt,
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    }, { onConflict: "user_id" });

  if (saveError) return reply(503, { error: "membership_grant_failed" });

  return reply(200, {
    success: true,
    user_id: targetUserId,
    status: "active",
    starts_at: startsAt,
    expires_at: expiresAt,
    membership_days_added: 30,
  });
});
