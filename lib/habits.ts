import { localDateString, weekdayOf } from "./timezone";
import type { FrequencyType, Habit } from "./types";

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Habit accent colors. `hex` (dark-mode value) is what's stored; `cssVar` swaps per theme. */
export const HABIT_COLORS = [
  { name: "Teal", hex: "#4FB0A5", cssVar: "var(--habit-teal)" },
  { name: "Coral", hex: "#E87461", cssVar: "var(--habit-coral)" },
  { name: "Lilac", hex: "#9E85D1", cssVar: "var(--habit-lilac)" },
  { name: "Green", hex: "#7BC48B", cssVar: "var(--habit-green)" },
  { name: "Amber", hex: "#E8A94A", cssVar: "var(--habit-amber)" },
  { name: "Pink", hex: "#D96B8E", cssVar: "var(--habit-pink)" },
  { name: "Blue", hex: "#6B8CDE", cssVar: "var(--habit-blue)" },
] as const;

export const DEFAULT_COLOR = HABIT_COLORS[0].hex;

/** Resolve a stored hex to a theme-aware CSS color (falls back to the raw hex). */
export function colorFor(hex: string | null | undefined): string {
  if (!hex) return HABIT_COLORS[0].cssVar;
  const m = HABIT_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  return m ? m.cssVar : hex;
}

/** Days (0=Sun..6=Sat) a habit is required on. */
export function requiredDays(h: Pick<Habit, "frequency_type" | "active_days">): number[] {
  return h.frequency_type === "daily" ? ALL_DAYS : [...(h.active_days ?? [])].sort((a, b) => a - b);
}

export function isRequiredOn(h: Pick<Habit, "frequency_type" | "active_days">, weekday: number): boolean {
  return h.frequency_type === "daily" || (h.active_days ?? []).includes(weekday);
}

export function frequencyLabel(h: Pick<Habit, "frequency_type" | "active_days">): string {
  if (h.frequency_type === "daily") return "Daily";
  const days = requiredDays(h);
  return days.length === 7 ? "Daily" : days.map((d) => WEEKDAY_SHORT[d]).join(" · ");
}

export type HabitInput = {
  name: string;
  description: string;
  color: string;
  frequency_type: FrequencyType;
  active_days: number[];
};

/** Returns an error message, or null when valid. Mirrors the DB CHECK constraints. */
export function validateHabit(i: HabitInput): string | null {
  const name = i.name.trim();
  if (!name) return "Give your habit a name.";
  if (name.length > 80) return "Name must be 80 characters or fewer.";
  if (i.description.length > 500) return "Description must be 500 characters or fewer.";
  if (i.frequency_type === "specific_days") {
    if (i.active_days.length === 0) return "Pick at least one day.";
    if (i.active_days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return "Invalid day selected.";
  }
  return null;
}

/**
 * Whether a habit is "live" on a given user-local date: it existed by then (creation day counts)
 * and had not been archived yet. Keeps history correct for habits created or archived later.
 */
export function isActiveOn(
  h: Pick<Habit, "created_at" | "archived_at">,
  dateStr: string,
  timeZone: string,
): boolean {
  const created = localDateString(timeZone, new Date(h.created_at));
  if (created > dateStr) return false;
  if (h.archived_at && localDateString(timeZone, new Date(h.archived_at)) <= dateStr) return false;
  return true;
}

/** Habits required on `dateStr` (live that day AND scheduled for its weekday). */
export function habitsForDate<T extends Habit>(habits: T[], dateStr: string, timeZone: string): T[] {
  const weekday = weekdayOf(dateStr);
  return habits.filter((h) => isActiveOn(h, dateStr, timeZone) && isRequiredOn(h, weekday));
}
