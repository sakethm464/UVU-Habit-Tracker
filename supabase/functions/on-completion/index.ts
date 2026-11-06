// Edge Function: on-completion
// Called by the Postgres trigger on public.completions (via pg_net) after every insert.
// Recomputes Daily + Weekly UVU and, if a milestone was JUST reached by this completion,
// asks send-push to deliver it (send-push dedups via notification_log).
//
//   POST { user_id }
import { adminClient, fetchAll, isAuthorized, json, SERVICE_ROLE_KEY, SUPABASE_URL } from "../_shared/common.ts";
import {
  completionKey,
  computeDailyStreak,
  computeWeeklyStreak,
  isCurrentWeekComplete,
  isDailyDayComplete,
  isDailyMilestone,
  isWeeklyMilestone,
  localDateString,
  milestoneMessage,
  toScheduled,
  type Habit,
} from "../_shared/streaks.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401);

  const { user_id } = (await req.json().catch(() => ({}))) as { user_id?: string };
  if (!user_id) return json({ error: "Bad request" }, 400);

  const supabase = adminClient();
  const { data: profile } = await supabase.from("profiles").select("push_enabled, timezone, week_start").eq("user_id", user_id).maybeSingle();
  if (!profile?.push_enabled) return json({ sent: [], reason: "push disabled" });

  const [habits, completions] = await Promise.all([
    fetchAll<Habit>((from, to) => supabase.from("habits").select("*").eq("user_id", user_id).order("id").range(from, to)),
    fetchAll<{ habit_id: string; completed_for: string }>((from, to) =>
      supabase.from("completions").select("habit_id, completed_for").eq("user_id", user_id).order("completed_for").order("habit_id").range(from, to),
    ),
  ]);

  const today = localDateString(profile.timezone); // always the user's timezone, re-read each run
  const scheduled = toScheduled(habits, profile.timezone);
  const done = new Set(completions.map((c) => completionKey(c.habit_id, c.completed_for)));

  // A milestone only counts when today actually contributed (day fully done / week fully done),
  // so completing an extra habit later in the day never re-announces an old streak.
  const candidates: { detail: string; message: string }[] = [];

  const daily = computeDailyStreak(scheduled, done, today);
  if (daily !== null && isDailyDayComplete(scheduled, done, today) && isDailyMilestone(daily)) {
    candidates.push({ detail: `daily:${daily}`, message: milestoneMessage("daily", daily) });
  }
  const weekly = computeWeeklyStreak(scheduled, done, today, profile.week_start);
  if (isCurrentWeekComplete(scheduled, done, today, profile.week_start) && isWeeklyMilestone(weekly)) {
    candidates.push({ detail: `weekly:${weekly}`, message: milestoneMessage("weekly", weekly) });
  }

  const sent: string[] = [];
  for (const c of candidates) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ user_id, type: "streak_milestone", detail: c.detail, message: c.message, habit_id: null }),
    });
    if (res.ok) sent.push(c.detail);
  }
  return json({ daily, weekly, candidates: candidates.map((c) => c.detail), sent });
});
