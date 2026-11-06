import { addDays } from "@/lib/timezone";
import { completionKey, isScheduledOn, type DoneSet, type ScheduledHabit } from "./schedule";

export type ConsistencyWindow = "week" | "month" | "year";
export const WINDOW_DAYS: Record<ConsistencyWindow, number> = { week: 7, month: 30, year: 365 };

export type Consistency = { completed: number; required: number; pct: number | null };

/**
 * Consistency % for one habit over the trailing window ending today: completed / required.
 * Only days the habit was live and scheduled count, today included (an unfinished today counts
 * as not done). View-only metric; never stored.
 */
export function computeConsistency(
  habit: ScheduledHabit,
  done: DoneSet,
  today: string,
  window: ConsistencyWindow,
): Consistency {
  let completed = 0;
  let required = 0;
  for (let i = 0; i < WINDOW_DAYS[window]; i++) {
    const day = addDays(today, -i);
    if (!isScheduledOn(habit, day)) continue;
    const ok = done.has(completionKey(habit.id, day));
    required++;
    if (ok) completed++;
  }
  return { completed, required, pct: required ? Math.round((completed / required) * 100) : null };
}
