import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStreaks, type Streaks } from "@/lib/streaks";
import type { Habit } from "@/lib/types";

const PAGE = 1000; // PostgREST default max rows per request

/** All of the signed-in user's completions (RLS-scoped), paged past the 1000-row cap. */
export async function fetchAllCompletions(supabase: SupabaseClient): Promise<{ habit_id: string; completed_for: string }[]> {
  const rows: { habit_id: string; completed_for: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("completions")
      .select("habit_id, completed_for")
      .order("completed_for", { ascending: true })
      .order("habit_id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Daily + Weekly UVU for the signed-in user. Includes archived habits so history stays intact. */
export async function getStreaks(
  supabase: SupabaseClient,
  opts: { timezone: string; weekStart: number; today: string },
): Promise<Streaks> {
  const [{ data: habits, error }, completions] = await Promise.all([
    supabase.from("habits").select("*"),
    fetchAllCompletions(supabase),
  ]);
  if (error) throw new Error(error.message);
  return computeStreaks((habits ?? []) as Habit[], completions, opts);
}
