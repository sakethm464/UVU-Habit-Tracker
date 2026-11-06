import { addDays } from "@/lib/timezone";
import { completionKey, isScheduledOn, weekStartOf, type DoneSet, type ScheduledHabit } from "./schedule";

type Instance = { habitId: string; day: string };

function instancesInWeek(habits: ScheduledHabit[], weekStart: string): Instance[] {
  const out: Instance[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    for (const h of habits) if (isScheduledOn(h, day)) out.push({ habitId: h.id, day });
  }
  return out;
}

/** True when every required instance in the user's current week is done (so the week counts now). */
export function isCurrentWeekComplete(habits: ScheduledHabit[], done: DoneSet, today: string, weekStart: number): boolean {
  const inst = instancesInWeek(habits, weekStartOf(today, weekStart));
  return inst.length > 0 && inst.every((i) => done.has(completionKey(i.habitId, i.day)));
}

/**
 * Weekly UVU: consecutive weeks in which every required instance of every habit (daily and
 * specific-days) was completed. Weeks run from `weekStart` (weekday of signup).
 *
 *  - Current week: if any required instance on a day BEFORE today is missing, the streak is 0
 *    (it breaks the moment an instance is missed). Otherwise the week counts once all its
 *    instances are done, and while still in progress it neither counts nor breaks.
 *  - Past weeks: all instances must be done; a week with no instances (before any habit
 *    existed) ends the walk.
 */
export function computeWeeklyStreak(habits: ScheduledHabit[], done: DoneSet, today: string, weekStart: number): number {
  if (habits.length === 0) return 0;
  const earliest = habits.reduce((min, h) => (h.firstDay < min ? h.firstDay : min), today);
  const isDone = (i: Instance) => done.has(completionKey(i.habitId, i.day));

  const currentStart = weekStartOf(today, weekStart);
  const current = instancesInWeek(habits, currentStart);
  if (current.some((i) => i.day < today && !isDone(i))) return 0;

  let streak = current.length > 0 && current.every(isDone) ? 1 : 0;

  let start = addDays(currentStart, -7);
  while (addDays(start, 6) >= earliest) {
    const inst = instancesInWeek(habits, start);
    if (inst.length === 0 || !inst.every(isDone)) break;
    streak++;
    start = addDays(start, -7);
  }
  return streak;
}
