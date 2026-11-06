// Timezone helpers. "Today" is always computed from profiles.timezone, never UTC/server zone.

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** 'YYYY-MM-DD' for the given instant as seen in `timeZone`. */
export function localDateString(timeZone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Weekday (0=Sun..6=Sat) of a 'YYYY-MM-DD' calendar date. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Add whole days to a 'YYYY-MM-DD' date (calendar math, DST-safe). */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Weekday (0=Sun..6=Sat) of "now" in `timeZone`. */
export function weekdayInTimeZone(timeZone: string, at: Date = new Date()): number {
  return weekdayOf(localDateString(timeZone, at));
}

/** Hour (0-23) of "now" in `timeZone`. */
export function hourInTimeZone(timeZone: string, at: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(at);
  return Number(h) % 24;
}

/** e.g. "Wednesday · November 4, 2026" for a 'YYYY-MM-DD' date. */
export function formatLongDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(dt);
  const rest = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(dt);
  return `${weekday} · ${rest}`;
}
