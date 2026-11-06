import { describe, expect, it } from "vitest";
import { colorFor, frequencyLabel, isRequiredOn, requiredDays, validateHabit } from "./habits";

const daily = { frequency_type: "daily" as const, active_days: null };
const mwf = { frequency_type: "specific_days" as const, active_days: [5, 1, 3] };

describe("frequency rules", () => {
  it("daily is required every weekday", () => {
    expect(requiredDays(daily)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(isRequiredOn(daily, 4)).toBe(true);
  });
  it("specific days are sorted and exclusive", () => {
    expect(requiredDays(mwf)).toEqual([1, 3, 5]);
    expect(isRequiredOn(mwf, 3)).toBe(true);
    expect(isRequiredOn(mwf, 2)).toBe(false);
  });
  it("labels", () => {
    expect(frequencyLabel(daily)).toBe("Daily");
    expect(frequencyLabel(mwf)).toBe("Mon · Wed · Fri");
    expect(frequencyLabel({ frequency_type: "specific_days", active_days: [0, 1, 2, 3, 4, 5, 6] })).toBe("Daily");
  });
});

describe("validateHabit", () => {
  const ok = { name: "Run", description: "", color: "#4FB0A5", frequency_type: "daily" as const, active_days: [] };
  it("accepts a valid habit", () => expect(validateHabit(ok)).toBeNull());
  it("requires a name", () => expect(validateHabit({ ...ok, name: "  " })).toMatch(/name/i));
  it("requires at least one day for specific_days", () =>
    expect(validateHabit({ ...ok, frequency_type: "specific_days" })).toMatch(/day/i));
  it("rejects out-of-range days", () =>
    expect(validateHabit({ ...ok, frequency_type: "specific_days", active_days: [7] })).toMatch(/invalid/i));
});

describe("colorFor", () => {
  it("maps stored hex to a theme variable, case-insensitively", () => {
    expect(colorFor("#e87461")).toBe("var(--habit-coral)");
  });
  it("falls back to the raw hex for custom colors", () => expect(colorFor("#123456")).toBe("#123456"));
});
