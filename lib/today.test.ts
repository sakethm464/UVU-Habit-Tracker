import { describe, expect, it } from "vitest";
import { habitsForDate, isActiveOn } from "./habits";
import { addDays, formatLongDate, hourInTimeZone, localDateString, weekdayOf } from "./timezone";
import type { Habit } from "./types";

const mk = (over: Partial<Habit>): Habit => ({
  id: "h", user_id: "u", name: "x", description: null, color: null, icon: null,
  frequency_type: "daily", active_days: null, created_at: "2026-11-01T12:00:00Z", archived_at: null, ...over,
});

describe("timezone helpers", () => {
  it("computes the user-local date, not UTC", () => {
    const t = new Date("2026-11-05T03:30:00Z"); // still Nov 4 evening in New York
    expect(localDateString("America/New_York", t)).toBe("2026-11-04");
    expect(localDateString("UTC", t)).toBe("2026-11-05");
    expect(localDateString("Asia/Tokyo", t)).toBe("2026-11-05");
  });
  it("end of day is sharp: 23:59 vs 00:00 local", () => {
    expect(localDateString("America/New_York", new Date("2026-11-05T04:59:59Z"))).toBe("2026-11-04");
    expect(localDateString("America/New_York", new Date("2026-11-05T05:00:00Z"))).toBe("2026-11-05");
  });
  it("weekday, addDays, hour, long date", () => {
    expect(weekdayOf("2026-11-04")).toBe(3); // Wednesday
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(hourInTimeZone("America/New_York", new Date("2026-11-05T05:00:00Z"))).toBe(0);
    expect(formatLongDate("2026-11-04")).toBe("Wednesday · November 4, 2026");
  });
});

describe("habitsForDate", () => {
  const tz = "America/New_York";
  it("respects schedule", () => {
    const mwf = mk({ id: "a", frequency_type: "specific_days", active_days: [1, 3, 5] });
    expect(habitsForDate([mwf], "2026-11-04", tz)).toHaveLength(1); // Wed
    expect(habitsForDate([mwf], "2026-11-05", tz)).toHaveLength(0); // Thu
  });
  it("creation day counts, earlier days do not", () => {
    const h = mk({ created_at: "2026-11-04T15:00:00Z" });
    expect(isActiveOn(h, "2026-11-04", tz)).toBe(true);
    expect(isActiveOn(h, "2026-11-03", tz)).toBe(false);
  });
  it("archived habits stop applying from the archive day", () => {
    const h = mk({ archived_at: "2026-11-04T15:00:00Z" });
    expect(isActiveOn(h, "2026-11-03", tz)).toBe(true);
    expect(isActiveOn(h, "2026-11-04", tz)).toBe(false);
  });
});
