import { localDateString, weekdayOf } from "@/lib/timezone";
import type { Habit } from "@/lib/types";

/** A habit reduced to what streak math needs, with its live range in user-local dates. */
export type ScheduledHabit = {
  id: string;
  frequency_type: Habit["frequency_type"];
  active_days: number[] | null;
  /** first user-local day the habit counts (creation day) */
  firstDay: string;
  /** user-local day it stopped counting (archive day, exclusive) or null while active */
  endDay: string | null;
};

/** Completed (habit, day) pairs. Build keys with completionKey(). */
export type DoneSet = Set<string>;

export const completionKey = (habitId: string, day: string) => `${habitId}|${day}`;

export function toScheduled(habits: Habit[], timeZone: string): ScheduledHabit[] {
  return habits.map((h) => ({
    id: h.id,
    frequency_type: h.frequency_type,
    active_days: h.active_days,
    firstDay: localDateString(timeZone, new Date(h.created_at)),
    endDay: h.archived_at ? localDateString(timeZone, new Date(h.archived_at)) : null,
  }));
}

/** Is the habit required on this user-local day (live that day AND scheduled for its weekday)? */
export function isScheduledOn(h: ScheduledHabit, day: string): boolean {
  if (day < h.firstDay) return false;
  if (h.endDay !== null && day >= h.endDay) return false;
  return h.frequency_type === "daily" || (h.active_days ?? []).includes(weekdayOf(day));
}

/** First day of the user's week containing `day` (weeks start on `weekStart`, 0=Sun..6=Sat). */
export function weekStartOf(day: string, weekStart: number): string {
  const back = (weekdayOf(day) - weekStart + 7) % 7;
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - back)).toISOString().slice(0, 10);
}
