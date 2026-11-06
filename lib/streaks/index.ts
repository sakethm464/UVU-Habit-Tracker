import type { Completion, Habit } from "@/lib/types";
import { computeDailyStreak } from "./daily";
import { completionKey, toScheduled } from "./schedule";
import { computeWeeklyStreak } from "./weekly";

export * from "./schedule";
export * from "./daily";
export * from "./weekly";
export * from "./consistency";

export type Streaks = { daily: number | null; weekly: number };

/** Daily + Weekly UVU from raw rows. `habits` must include archived ones (history). */
export function computeStreaks(
  habits: Habit[],
  completions: Pick<Completion, "habit_id" | "completed_for">[],
  opts: { timezone: string; weekStart: number; today: string },
): Streaks {
  const scheduled = toScheduled(habits, opts.timezone);
  const done = new Set(completions.map((c) => completionKey(c.habit_id, c.completed_for)));
  return {
    daily: computeDailyStreak(scheduled, done, opts.today),
    weekly: computeWeeklyStreak(scheduled, done, opts.today, opts.weekStart),
  };
}
