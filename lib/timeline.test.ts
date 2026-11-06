import { describe, expect, it } from "vitest";
import { completionKey, type ScheduledHabit } from "@/lib/streaks";
import { buildCells } from "./timeline";

const h: ScheduledHabit = { id: "a", frequency_type: "specific_days", active_days: [1, 3], firstDay: "2026-10-01", endDay: null };

describe("buildCells", () => {
  it("classifies done / missed / pending / off, oldest first, ending today", () => {
    const done = new Set([completionKey("a", "2026-11-02")]);
    const cells = buildCells(h, done, "2026-11-04", 4); // Nov 1 (Sun) .. Nov 4 (Wed)
    expect(cells.map((c) => c.day)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"]);
    expect(cells.map((c) => c.state)).toEqual(["off", "done", "off", "pending"]);
  });
  it("marks past required days not completed as missed", () => {
    const cells = buildCells(h, new Set(), "2026-11-04", 3);
    expect(cells.map((c) => c.state)).toEqual(["missed", "off", "pending"]); // Mon missed
  });
  it("is off before the habit existed", () => {
    const late = { ...h, frequency_type: "daily" as const, active_days: null, firstDay: "2026-11-04" };
    const cells = buildCells(late, new Set(), "2026-11-04", 3);
    expect(cells.map((c) => c.state)).toEqual(["off", "off", "pending"]);
  });
});
