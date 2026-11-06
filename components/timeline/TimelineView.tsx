"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { colorFor, frequencyLabel } from "@/lib/habits";
import type { Cell } from "@/lib/timeline";
import type { Habit } from "@/lib/types";
import { CellGrid } from "./CellGrid";

export type TimelineRow = {
  habit: Habit;
  /** last 30 days, oldest to newest */
  cells: Cell[];
  weekPct: number | null;
  monthPct: number | null;
};

type Range = "week" | "month";

export function TimelineView({ rows }: { rows: TimelineRow[] }) {
  const [range, setRange] = useState<Range>("week");

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-7">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.6px]">Timeline</h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Every check-in, filled in over time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div role="radiogroup" aria-label="Range" className="inline-flex gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1">
            {(["week", "month"] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={range === r}
                onClick={() => setRange(r)}
                className={
                  "rounded-[9px] border px-[14px] py-[7px] text-[13px] capitalize transition-colors " +
                  (range === r
                    ? "border-[var(--gold-border)] bg-[var(--gold-soft)] font-bold text-[var(--gold-text)]"
                    : "border-transparent font-medium text-[var(--text-secondary)] hover:text-[var(--text)]")
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[20px] border border-dashed border-[var(--border)] px-8 py-16 text-center">
          <h2 className="text-[20px] font-bold">Nothing to show yet</h2>
          <p className="max-w-[360px] text-[14px] text-[var(--text-secondary)]">Create a habit and check it off. Your timeline fills in from today.</p>
          <ButtonLink href="/habits">Create a habit</ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {rows.map(({ habit, cells, weekPct, monthPct }) => {
            const c = colorFor(habit.color);
            const shown = range === "week" ? cells.slice(-7) : cells;
            const pct = range === "week" ? weekPct : monthPct;
            return (
              <Link
                key={habit.id}
                href={`/timeline/${habit.id}`}
                className="group flex flex-col gap-4 rounded-[20px] border p-5 no-underline transition-colors hover:border-[var(--gold-border)]"
                style={{
                  background: `color-mix(in srgb, ${c} 6%, var(--surface))`,
                  borderColor: `color-mix(in srgb, ${c} 22%, transparent)`,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
                    <HabitIcon name={habit.icon} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-[var(--text)]">{habit.name}</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">{frequencyLabel(habit)}</div>
                  </div>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: c }}>
                    ● {pct === null ? "–" : `${pct}%`}
                  </span>
                </div>
                <CellGrid cells={shown} color={c} columns={range === "week" ? 7 : 15} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
