import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/timezone";
import { computeConsistency } from "./consistency";
import { computeDailyStreak } from "./daily";
import { completionKey, isScheduledOn, weekStartOf, type ScheduledHabit } from "./schedule";
import { computeWeeklyStreak } from "./weekly";

const TODAY = "2026-11-04"; // Wednesday
const mk = (id: string, over: Partial<ScheduledHabit> = {}): ScheduledHabit => ({
  id,
  frequency_type: "daily",
  active_days: null,
  firstDay: "2026-10-01",
  endDay: null,
  ...over,
});
/** completions for `id` on every day from..to inclusive */
function doneRange(id: string, from: string, to: string, into = new Set<string>()) {
  for (let d = from; d <= to; d = addDays(d, 1)) into.add(completionKey(id, d));
  return into;
}
const addAll = (id: string, days: string[], into = new Set<string>()) => {
  days.forEach((d) => into.add(completionKey(id, d)));
  return into;
};

describe("schedule helpers", () => {
  it("weekStartOf anchors to the user's week start", () => {
    expect(weekStartOf("2026-11-04", 0)).toBe("2026-11-01"); // Sun-start
    expect(weekStartOf("2026-11-04", 3)).toBe("2026-11-04"); // Wed-start: today starts the week
    expect(weekStartOf("2026-11-04", 4)).toBe("2026-10-29"); // Thu-start
    expect(weekStartOf("2026-11-01", 1)).toBe("2026-10-26"); // Mon-start: Sunday belongs to the prior week
  });
  it("isScheduledOn honors creation day, archive day (exclusive) and weekdays", () => {
    const h = mk("a", { firstDay: "2026-11-02", endDay: "2026-11-05" });
    expect(isScheduledOn(h, "2026-11-01")).toBe(false);
    expect(isScheduledOn(h, "2026-11-02")).toBe(true);
    expect(isScheduledOn(h, "2026-11-04")).toBe(true);
    expect(isScheduledOn(h, "2026-11-05")).toBe(false);
    const mw = mk("b", { frequency_type: "specific_days", active_days: [1, 3] });
    expect(isScheduledOn(mw, "2026-11-04")).toBe(true); // Wed
    expect(isScheduledOn(mw, "2026-11-05")).toBe(false);
  });
});

describe("Daily UVU", () => {
  const h = [mk("a")];
  it("is null when there is no daily habit", () => {
    expect(computeDailyStreak([], new Set(), TODAY)).toBeNull();
    expect(computeDailyStreak([mk("s", { frequency_type: "specific_days", active_days: [3] })], new Set(), TODAY)).toBeNull();
    expect(computeDailyStreak([mk("a", { endDay: "2026-11-01" })], new Set(), TODAY)).toBeNull(); // archived
  });
  it("counts finished days; an unfinished today does not break it", () => {
    expect(computeDailyStreak(h, doneRange("a", "2026-11-01", "2026-11-03"), TODAY)).toBe(3);
  });
  it("adds today once done", () => {
    expect(computeDailyStreak(h, doneRange("a", "2026-11-01", "2026-11-04"), TODAY)).toBe(4);
  });
  it("a missed yesterday resets it", () => {
    expect(computeDailyStreak(h, doneRange("a", "2026-11-04", "2026-11-04"), TODAY)).toBe(1);
    expect(computeDailyStreak(h, doneRange("a", "2026-10-25", "2026-11-02"), TODAY)).toBe(0);
  });
  it("requires every daily habit each day", () => {
    const two = [mk("a"), mk("b")];
    const done = doneRange("a", "2026-11-01", "2026-11-03");
    doneRange("b", "2026-11-02", "2026-11-03", done); // b missed Nov 1
    expect(computeDailyStreak(two, done, TODAY)).toBe(2);
  });
  it("ignores specific-days habits", () => {
    const hs = [mk("a"), mk("s", { frequency_type: "specific_days", active_days: [1] })];
    expect(computeDailyStreak(hs, doneRange("a", "2026-11-01", "2026-11-03"), TODAY)).toBe(3);
  });
  it("does not count days before the habit existed", () => {
    const fresh = [mk("a", { firstDay: "2026-11-03" })];
    expect(computeDailyStreak(fresh, doneRange("a", "2026-11-03", "2026-11-04"), TODAY)).toBe(2);
  });
  it("a habit added mid-streak only raises the bar from its creation day", () => {
    const hs = [mk("a"), mk("b", { firstDay: "2026-11-03" })];
    const done = doneRange("a", "2026-10-30", "2026-11-03");
    doneRange("b", "2026-11-03", "2026-11-03", done);
    expect(computeDailyStreak(hs, done, TODAY)).toBe(5);
  });
  it("an archived daily habit stops being required after its archive day", () => {
    const hs = [mk("a"), mk("old", { endDay: "2026-11-03" })];
    const done = doneRange("a", "2026-11-01", "2026-11-03");
    doneRange("old", "2026-11-01", "2026-11-02", done);
    expect(computeDailyStreak(hs, done, TODAY)).toBe(3);
  });
});

describe("Weekly UVU (Sunday-start weeks: Oct 18-24, Oct 25-31, Nov 1-7)", () => {
  const h = [mk("a")];
  it("is 0 with no habits", () => expect(computeWeeklyStreak([], new Set(), TODAY, 0)).toBe(0));
  it("counts fully completed past weeks; the in-progress week neither counts nor breaks", () => {
    const done = doneRange("a", "2026-10-18", "2026-11-03");
    expect(computeWeeklyStreak(h, done, TODAY, 0)).toBe(2);
    doneRange("a", TODAY, TODAY, done); // today done, rest of week still ahead
    expect(computeWeeklyStreak(h, done, TODAY, 0)).toBe(2);
  });
  it("breaks the moment a required instance is missed in the current week", () => {
    const done = doneRange("a", "2026-10-18", "2026-11-01");
    doneRange("a", "2026-11-03", "2026-11-04", done); // missed Nov 2
    expect(computeWeeklyStreak(h, done, TODAY, 0)).toBe(0);
  });
  it("a missed day in an earlier week ends the walk there", () => {
    const done = doneRange("a", "2026-10-25", "2026-11-03"); // Oct 18-24 not done
    expect(computeWeeklyStreak(h, done, TODAY, 0)).toBe(1);
  });
  it("specific-days: a missed Monday this week resets to 0", () => {
    const mw = [mk("m", { frequency_type: "specific_days", active_days: [1, 3] })]; // Mon, Wed
    const done = addAll("m", ["2026-10-19", "2026-10-21", "2026-10-26", "2026-10-28"]);
    expect(computeWeeklyStreak(mw, done, TODAY, 0)).toBe(0); // Mon Nov 2 missed
  });
  it("specific-days: the week counts as soon as every scheduled instance is done", () => {
    const mw = [mk("m", { frequency_type: "specific_days", active_days: [1, 3] })];
    const done = addAll("m", ["2026-10-19", "2026-10-21", "2026-10-26", "2026-10-28", "2026-11-02", "2026-11-04"]);
    expect(computeWeeklyStreak(mw, done, TODAY, 0)).toBe(3);
  });
  it("specific-days: Wednesday still pending does not break or count the week", () => {
    const mw = [mk("m", { frequency_type: "specific_days", active_days: [1, 3] })];
    const done = addAll("m", ["2026-10-19", "2026-10-21", "2026-10-26", "2026-10-28", "2026-11-02"]);
    expect(computeWeeklyStreak(mw, done, TODAY, 0)).toBe(2);
  });
  it("combines daily and specific-days habits", () => {
    const hs = [mk("a"), mk("m", { frequency_type: "specific_days", active_days: [1, 3] })];
    const done = doneRange("a", "2026-10-25", "2026-11-03");
    addAll("m", ["2026-10-26", "2026-10-28", "2026-11-02"], done);
    expect(computeWeeklyStreak(hs, done, TODAY, 0)).toBe(1); // Oct 18-24 has nothing done
  });
  it("anchors weeks to week_start (Wednesday-start: today begins a new week)", () => {
    // Weeks: Oct 21-27, Oct 28-Nov 3, Nov 4-10 (current, one day in)
    const done = doneRange("a", "2026-10-21", "2026-11-03");
    expect(computeWeeklyStreak(h, done, TODAY, 3)).toBe(2);
  });
  it("a habit created mid-week only needs its own days; earlier empty weeks end the walk", () => {
    const fresh = [mk("a", { firstDay: "2026-10-28" })];
    const done = doneRange("a", "2026-10-28", "2026-11-03");
    expect(computeWeeklyStreak(fresh, done, TODAY, 0)).toBe(1); // Oct 25-31 is partial but complete
  });
  it("archived habit instances stop being required", () => {
    const hs = [mk("a"), mk("old", { endDay: "2026-11-01" })];
    const done = doneRange("a", "2026-10-25", "2026-11-03");
    doneRange("old", "2026-10-25", "2026-10-31", done);
    expect(computeWeeklyStreak(hs, done, TODAY, 0)).toBe(1);
  });
});

describe("local-date boundary (sharp end of day)", () => {
  it("the caller's user-local 'today' decides; a full missed day resets the streak", () => {
    const done = doneRange("a", "2026-11-01", "2026-11-03");
    expect(computeDailyStreak([mk("a")], done, "2026-11-04")).toBe(3); // just after local midnight
    expect(computeDailyStreak([mk("a")], done, "2026-11-05")).toBe(0); // Nov 4 was never done
  });
});

describe("Consistency %", () => {
  it("is completed / required over the trailing window; a pending today counts as required", () => {
    const h = mk("a");
    const done = doneRange("a", "2026-10-29", "2026-11-03");
    expect(computeConsistency(h, done, TODAY, "week")).toEqual({ completed: 6, required: 7, pct: 86 });
    done.delete(completionKey("a", "2026-10-31"));
    expect(computeConsistency(h, done, TODAY, "week")).toEqual({ completed: 5, required: 7, pct: 71 });
  });
  it("counts today when completed", () => {
    const done = doneRange("a", "2026-11-04", "2026-11-04");
    expect(computeConsistency(mk("a", { firstDay: "2026-11-04" }), done, TODAY, "week")).toEqual({
      completed: 1,
      required: 1,
      pct: 100,
    });
  });
  it("only counts scheduled weekdays for specific-days habits", () => {
    const h = mk("m", { frequency_type: "specific_days", active_days: [1, 3] });
    const done = addAll("m", ["2026-11-02"]);
    // window Oct 29..Nov 4: Mon Nov 2 done, Wed Nov 4 (today) not done yet
    expect(computeConsistency(h, done, TODAY, "week")).toEqual({ completed: 1, required: 2, pct: 50 });
  });
  it("is null when nothing was required", () => {
    expect(computeConsistency(mk("a", { firstDay: "2026-11-05" }), new Set(), TODAY, "month").pct).toBeNull();
  });
});
