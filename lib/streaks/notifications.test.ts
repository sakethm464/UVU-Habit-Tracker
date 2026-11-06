import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/timezone";
import { streakBrokenOn } from "./broken";
import { isDailyDayComplete } from "./daily";
import { isDailyMilestone, isWeeklyMilestone, milestoneMessage } from "./milestones";
import { completionKey, type ScheduledHabit } from "./schedule";
import { isCurrentWeekComplete } from "./weekly";

const mk = (id: string, over: Partial<ScheduledHabit> = {}): ScheduledHabit => ({
  id,
  frequency_type: "daily",
  active_days: null,
  firstDay: "2026-10-01",
  endDay: null,
  ...over,
});
function range(id: string, from: string, to: string, into = new Set<string>()) {
  for (let d = from; d <= to; d = addDays(d, 1)) into.add(completionKey(id, d));
  return into;
}

describe("milestones", () => {
  it("daily: 7, 30, then every +30", () => {
    const hits = Array.from({ length: 125 }, (_, i) => i).filter(isDailyMilestone);
    expect(hits).toEqual([7, 30, 60, 90, 120]);
  });
  it("weekly: every +4", () => {
    expect([1, 3, 4, 5, 8, 12].filter(isWeeklyMilestone)).toEqual([4, 8, 12]);
  });
  it("messages", () => {
    expect(milestoneMessage("daily", 7)).toBe("🔥 7-day UVU! Keep it going.");
    expect(milestoneMessage("weekly", 4)).toBe("🔥 4-week UVU! Keep it going.");
  });
});

describe("completion guards used by on-completion", () => {
  it("daily day is complete only when every daily habit is done", () => {
    const hs = [mk("a"), mk("b")];
    const done = range("a", "2026-11-04", "2026-11-04");
    expect(isDailyDayComplete(hs, done, "2026-11-04")).toBe(false);
    range("b", "2026-11-04", "2026-11-04", done);
    expect(isDailyDayComplete(hs, done, "2026-11-04")).toBe(true);
  });
  it("current week is complete only when all instances (incl. future days) are done", () => {
    const hs = [mk("m", { frequency_type: "specific_days", active_days: [1, 3] })]; // Mon, Wed
    const done = new Set([completionKey("m", "2026-11-02")]);
    expect(isCurrentWeekComplete(hs, done, "2026-11-04", 0)).toBe(false);
    done.add(completionKey("m", "2026-11-04"));
    expect(isCurrentWeekComplete(hs, done, "2026-11-04", 0)).toBe(true);
  });
});

describe("streakBrokenOn (day that just ended = Nov 3)", () => {
  const missedDay = "2026-11-03";
  it("fires when a live daily streak was lost", () => {
    const done = range("a", "2026-10-25", "2026-11-02");
    expect(streakBrokenOn([mk("a")], done, missedDay, 0)).toBe(true);
  });
  it("does not fire when nothing was missed", () => {
    const done = range("a", "2026-10-25", "2026-11-03");
    expect(streakBrokenOn([mk("a")], done, missedDay, 0)).toBe(false);
  });
  it("does not fire when there was no streak to lose", () => {
    expect(streakBrokenOn([mk("a", { firstDay: "2026-11-02" })], new Set(), missedDay, 0)).toBe(false);
  });
  it("fires for weekly when completed weeks were behind you, even for a specific-days miss", () => {
    const hs = [mk("m", { frequency_type: "specific_days", active_days: [1, 2] })]; // Mon, Tue
    const done = new Set(["2026-10-19", "2026-10-20", "2026-10-26", "2026-10-27"].map((d) => completionKey("m", d)));
    // Mon Nov 2 done, Tue Nov 3 missed -> weekly streak (2 completed weeks) lost
    done.add(completionKey("m", "2026-11-02"));
    expect(streakBrokenOn(hs, done, missedDay, 0)).toBe(true);
  });
  it("does not fire when the user already broke the streak earlier", () => {
    const done = range("a", "2026-10-25", "2026-10-31"); // missed Nov 1 and Nov 2 already
    expect(streakBrokenOn([mk("a")], done, missedDay, 0)).toBe(false);
  });
});
