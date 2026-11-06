import { describe, expect, it } from "vitest";
import { DEFAULT_ICON, isIconKey, pickIcon } from "./icons";

describe("pickIcon", () => {
  it("matches common habit names", () => {
    expect(pickIcon("Drink 8 glasses of water")).toBe("water");
    expect(pickIcon("Morning run")).toBe("run");
    expect(pickIcon("Read 30 minutes")).toBe("book");
    expect(pickIcon("Meditate")).toBe("meditate");
    expect(pickIcon("Workout")).toBe("workout");
    expect(pickIcon("Journal")).toBe("journal");
  });
  it("is case-insensitive and falls back to the default", () => {
    expect(pickIcon("MEDITATE")).toBe("meditate");
    expect(pickIcon("zzz qqq")).toBe(DEFAULT_ICON);
    expect(pickIcon("")).toBe(DEFAULT_ICON);
  });
  it("validates keys", () => {
    expect(isIconKey("water")).toBe(true);
    expect(isIconKey("nope")).toBe(false);
  });
});
