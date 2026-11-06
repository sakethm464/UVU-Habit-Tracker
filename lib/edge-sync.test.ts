import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OUT, generate } from "../scripts/sync-edge-streaks.mjs";

describe("edge function streak copy", () => {
  it("supabase/functions/_shared/streaks.ts matches lib/ (run `npm run sync:edge` if this fails)", () => {
    const onDisk = readFileSync(OUT, "utf8").replace(/\r\n/g, "\n");
    expect(onDisk).toBe(generate());
  });
});
