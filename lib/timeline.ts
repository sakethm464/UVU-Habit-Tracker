import { addDays } from "@/lib/timezone";
import { completionKey, isScheduledOn, type DoneSet, type ScheduledHabit } from "@/lib/streaks";

/**
 * done    = required and completed (filled color)
 * missed  = required, day is over, not completed (empty)
 * pending = required today and not completed yet (outlined, can still be done)
 * off     = not required that day (neutral)
 */
export type CellState = "done" | "missed" | "pending" | "off";
export type Cell = { day: string; state: CellState };

/** Oldest to newest, ending today. */
export function buildCells(habit: ScheduledHabit, done: DoneSet, today: string, days: number): Cell[] {
  const cells: Cell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    let state: CellState = "off";
    if (isScheduledOn(habit, day)) {
      if (done.has(completionKey(habit.id, day))) state = "done";
      else state = day === today ? "pending" : "missed";
    }
    cells.push({ day, state });
  }
  return cells;
}
