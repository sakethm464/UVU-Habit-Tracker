import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllCompletions } from "@/lib/data/streaks.server";
import { completionKey, toScheduled, type ScheduledHabit } from "@/lib/streaks";
import { createClient } from "@/lib/supabase/server";
import { localDateString } from "@/lib/timezone";
import type { Habit, Profile } from "@/lib/types";

export type TimelineContext = {
  supabase: SupabaseClient;
  timezone: string;
  weekStart: number;
  today: string;
  /** active (unarchived) habits, oldest first */
  habits: Habit[];
  scheduled: Map<string, ScheduledHabit>;
  done: Set<string>;
};

/** Shared loader for the Timeline and habit detail pages. */
export async function loadTimelineContext(): Promise<TimelineContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  const profile = profileRow as Profile | null;
  const timezone = profile?.timezone ?? "UTC";

  const [{ data: habitRows }, completions] = await Promise.all([
    supabase.from("habits").select("*").is("archived_at", null).order("created_at", { ascending: true }),
    fetchAllCompletions(supabase),
  ]);
  const habits = (habitRows ?? []) as Habit[];

  return {
    supabase,
    timezone,
    weekStart: profile?.week_start ?? 0,
    today: localDateString(timezone),
    habits,
    scheduled: new Map(toScheduled(habits, timezone).map((s) => [s.id, s])),
    done: new Set(completions.map((c) => completionKey(c.habit_id, c.completed_for))),
  };
}
