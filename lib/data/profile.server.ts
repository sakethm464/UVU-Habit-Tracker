import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isValidTimeZone, weekdayInTimeZone } from "@/lib/timezone";
import type { Profile } from "@/lib/types";

/**
 * Returns the signed-in user's profile, creating it if missing.
 *
 * profiles rows are normally created by the on_auth_user_created trigger. An account that
 * predates the trigger (or signed up while it wasn't applied) has no row, which used to break
 * Settings (and silently dropped every profile update). Mirrors handle_new_user(): timezone and
 * week_start come from signup metadata, falling back to UTC / today's weekday. RLS allows the
 * user to insert their own row.
 */
export async function ensureProfile(supabase: SupabaseClient, user: User): Promise<Profile | null> {
  const existing = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (existing.data) return existing.data as Profile;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const tzMeta = typeof meta.timezone === "string" ? meta.timezone : "";
  const timezone = tzMeta && isValidTimeZone(tzMeta) ? tzMeta : "UTC";
  const ws = Number(meta.week_start);
  const week_start = Number.isInteger(ws) && ws >= 0 && ws <= 6 ? ws : weekdayInTimeZone(timezone);
  const name = typeof meta.display_name === "string" ? meta.display_name.trim() : "";

  const { data, error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, display_name: name || null, timezone, week_start })
    .select("*")
    .single();
  if (data) return data as Profile;

  // Lost a race with another request (unique violation): the row exists now.
  if (error?.code === "23505") {
    const again = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    return (again.data as Profile | null) ?? null;
  }
  return null;
}
