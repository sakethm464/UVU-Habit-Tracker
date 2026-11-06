// Shared helpers for the UVU Edge Functions (Deno).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// verify_jwt is off for these functions, so the key check below is the only gate: fail loudly
// at startup rather than accept a predictable "Bearer undefined".
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
const BEAMS_INSTANCE_ID = Deno.env.get("BEAMS_INSTANCE_ID") ?? "";
const BEAMS_SECRET_KEY = Deno.env.get("BEAMS_SECRET_KEY") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "";

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** These functions are internal: only callers holding the service-role key (pg_net, other functions). */
export function isAuthorized(req: Request): boolean {
  const got = new TextEncoder().encode(req.headers.get("Authorization") ?? "");
  const want = new TextEncoder().encode(`Bearer ${SERVICE_ROLE_KEY}`);
  // Constant-time compare (length leak only, which is fine for a fixed-size secret).
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

const PAGE = 1000;

export async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Publish a web push to one user via the Pusher Beams REST API. */
export async function publishToUser(userId: string, title: string, body: string): Promise<void> {
  if (!BEAMS_INSTANCE_ID || !BEAMS_SECRET_KEY) throw new Error("BEAMS_INSTANCE_ID / BEAMS_SECRET_KEY are not set");
  const res = await fetch(`https://${BEAMS_INSTANCE_ID}.pushnotifications.pusher.com/publish_api/v1/instances/${BEAMS_INSTANCE_ID}/publishes/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${BEAMS_SECRET_KEY}` },
    body: JSON.stringify({
      users: [userId],
      web: { notification: { title, body, ...(APP_URL ? { deep_link: `${APP_URL}/today` } : {}) } },
    }),
  });
  if (!res.ok) throw new Error(`Beams publish failed: ${res.status} ${await res.text()}`);
}
