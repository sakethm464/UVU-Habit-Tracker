import { addDays } from "@/lib/timezone";
import { completionKey, isScheduledOn, type DoneSet, type ScheduledHabit } from "./schedule";

/**
 * Daily UVU: consecutive days on which EVERY daily habit was completed.
 * Returns null when the user has no (unarchived) daily habit: the streak doesn't exist then.
 *
 * Rules:
 *  - Walk back from today. Today only extends the streak once complete; an unfinished today
 *    never breaks it (end of day is sharp, but it can still be done until 23:59 local).
 *  - A past day with an unmet daily habit ends the streak, as does a day with no daily
 *    habit scheduled at all (before any existed).
 */
/** True when at least one daily habit is scheduled on `day` and every one of them is done. */
export function isDailyDayComplete(habits: ScheduledHabit[], done: DoneSet, day: string): boolean {
  const required = habits.filter((h) => h.frequency_type === "daily" && isScheduledOn(h, day));
  return required.length > 0 && required.every((h) => done.has(completionKey(h.id, day)));
}

export function computeDailyStreak(habits: ScheduledHabit[], done: DoneSet, today: string): number | null {
  const daily = habits.filter((h) => h.frequency_type === "daily");
  if (!daily.some((h) => h.endDay === null)) return null;

  const earliest = daily.reduce((min, h) => (h.firstDay < min ? h.firstDay : min), today);
  const dayStatus = (day: string) => isDailyDayComplete(daily, done, day);

  let streak = 0;
  let day = today;
  if (dayStatus(day)) streak++;
  day = addDays(day, -1);

  while (day >= earliest && dayStatus(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
