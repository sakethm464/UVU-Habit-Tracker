import { addDays } from "@/lib/timezone";
import { isDailyDayComplete } from "./daily";
import { completionKey, isScheduledOn, type DoneSet, type ScheduledHabit } from "./schedule";
import { computeWeeklyStreak } from "./weekly";

/** Habits that were required on `day` but have no completion. */
export function missedOn(habits: ScheduledHabit[], done: DoneSet, day: string): ScheduledHabit[] {
  return habits.filter((h) => isScheduledOn(h, day) && !done.has(completionKey(h.id, day)));
}

/**
 * Should the user get a "streak broken" push for `missedDay` (the day that just ended)?
 * Only when a streak that was alive at the end of the previous day was actually lost, so people
 * with nothing to lose aren't pinged:
 *  - Daily UVU: the previous day was fully done AND a daily habit was missed on `missedDay`.
 *  - Weekly UVU: it was above 0 at the end of the previous day AND anything was missed on `missedDay`.
 */
export function streakBrokenOn(habits: ScheduledHabit[], done: DoneSet, missedDay: string, weekStart: number): boolean {
  const missed = missedOn(habits, done, missedDay);
  if (missed.length === 0) return false;

  const before = addDays(missedDay, -1);
  const dailyLost = missed.some((h) => h.frequency_type === "daily") && isDailyDayComplete(habits, done, before);
  const weeklyLost = computeWeeklyStreak(habits, done, before, weekStart) > 0;
  return dailyLost || weeklyLost;
}
