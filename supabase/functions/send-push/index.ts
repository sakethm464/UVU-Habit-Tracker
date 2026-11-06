// Edge Function: send-push
// Internal. Called by pg_cron (streak_broken) and by on-completion (streak_milestone).
//
//   POST { user_id, type: 'streak_broken',    detail: 'YYYY-MM-DD' (the day that ended) }
//   POST { user_id, type: 'streak_milestone', detail: 'daily:7' | 'weekly:4', message }
//
// Order: skip if push is off -> (streak_broken only) verify a live streak was really lost ->
// dedup insert into notification_log -> publish to Beams (3 attempts). If every attempt fails the
// log row is removed. streak_broken is then retried by the next cron tick (run_streak_broken_check
// keeps trying for 2 hours); a milestone is not retried beyond the in-request attempts.
import { adminClient, fetchAll, isAuthorized, json, publishToUser } from "../_shared/common.ts";
import { completionKey, streakBrokenOn, STREAK_BROKEN_MESSAGE, toScheduled, type Habit } from "../_shared/streaks.ts";

type Body = { user_id?: string; type?: "streak_broken" | "streak_milestone"; detail?: string; habit_id?: string | null; message?: string };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401);

  const body = (await req.json().catch(() => ({}))) as Body;
  const { user_id, type, detail } = body;
  if (!user_id || (type !== "streak_broken" && type !== "streak_milestone")) return json({ error: "Bad request" }, 400);

  const supabase = adminClient();

  const { data: profile } = await supabase.from("profiles").select("push_enabled, timezone, week_start").eq("user_id", user_id).maybeSingle();
  if (!profile?.push_enabled) return json({ sent: false, reason: "push disabled" });

  if (!detail) return json({ error: "detail is required" }, 400);

  let message = body.message ?? "";
  if (type === "streak_broken") {
    // The 2h cron window can straddle UTC midnight, which the (UTC-day) dedup index would not catch.
    const { data: already } = await supabase.from("notification_log").select("id").eq("user_id", user_id).eq("type", type).eq("detail", detail).limit(1);
    if (already?.length) return json({ sent: false, reason: "duplicate" });

    const [habits, completions] = await Promise.all([
      fetchAll<Habit>((from, to) => supabase.from("habits").select("*").eq("user_id", user_id).order("id").range(from, to)),
      fetchAll<{ habit_id: string; completed_for: string }>((from, to) =>
        supabase.from("completions").select("habit_id, completed_for").eq("user_id", user_id).order("completed_for").order("habit_id").range(from, to),
      ),
    ]);
    const done = new Set(completions.map((c) => completionKey(c.habit_id, c.completed_for)));
    if (!streakBrokenOn(toScheduled(habits, profile.timezone), done, detail, profile.week_start)) {
      return json({ sent: false, reason: "no live streak was lost" });
    }
    message = STREAK_BROKEN_MESSAGE;
  } else if (!message) {
    return json({ error: "message is required for streak_milestone" }, 400);
  }

  // Dedup (unique index on user, habit, type, detail, UTC day). A conflict means already sent.
  const { data: logRow, error: logError } = await supabase
    .from("notification_log")
    .insert({ user_id, habit_id: body.habit_id ?? null, type, detail })
    .select("id")
    .single();
  if (logError || !logRow) {
    if (logError?.code === "23505") return json({ sent: false, reason: "duplicate" });
    return json({ error: logError?.message ?? "log insert failed" }, 500);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await publishToUser(user_id, "UVU", message);
      return json({ sent: true });
    } catch (e) {
      lastError = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  await supabase.from("notification_log").delete().eq("id", logRow.id);
  return json({ error: lastError instanceof Error ? lastError.message : "publish failed" }, 502);
});
