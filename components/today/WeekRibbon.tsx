"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { colorFor, habitsForDate, WEEKDAY_SHORT } from "@/lib/habits";
import { addDays, weekdayOf } from "@/lib/timezone";
import type { Habit } from "@/lib/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MAX_WEEKS = 4; // completions are loaded for the last 28 days

type Props = {
  today: string;
  timezone: string;
  habits: Habit[];
  /** completed habit ids per date ('YYYY-MM-DD'); today's entry reflects optimistic state */
  completedByDate: Record<string, Set<string>>;
  selected: string;
  onSelect: (date: string) => void;
};

/**
 * Rolling 7-day strip starting at today (Google-Calendar style). Hovering a day previews its
 * habits; clicking selects it so the list below shows that day (read-only unless it's today).
 */
export function WeekRibbon({ today, timezone, habits, completedByDate, selected, onSelect }: Props) {
  const [offset, setOffset] = useState(0);
  const start = addDays(today, offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const mid = days[3];
  const [y, m] = mid.split("-").map(Number);

  return (
    <section
      aria-label="Week"
      className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-baseline gap-[10px]">
          <span className="text-gold text-[20px] font-bold tracking-[-0.3px]">{MONTHS[m - 1]}</span>
          <span className="text-[14px] text-[var(--text-muted)]">{y}</span>
        </div>
        <div className="flex gap-[6px]">
          {[
            { label: "Previous week", delta: -1, Icon: ChevronLeftIcon, disabled: offset <= -MAX_WEEKS },
            { label: "Next week", delta: 1, Icon: ChevronRightIcon, disabled: offset >= MAX_WEEKS },
          ].map(({ label, delta, Icon, disabled }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              disabled={disabled}
              onClick={() => setOffset((o) => o + delta)}
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const isToday = d === today;
          const isFuture = d > today;
          const required = habitsForDate(habits, d, timezone);
          const done = completedByDate[d];
          const dayNum = Number(d.slice(8));
          const isSelected = d === selected;
          return (
            <div key={d} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              className={
                "flex w-full cursor-pointer flex-col items-center gap-[10px] py-3 transition-colors " +
                (isToday
                  ? "rounded-[16px] border border-[var(--gold-border)] bg-[var(--gold-soft)]"
                  : isSelected
                    ? "rounded-[16px] border border-[var(--gold-border)] bg-[var(--surface-hover,transparent)]"
                    : "rounded-[12px] border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover,rgba(255,255,255,0.03))]")
              }
              style={isToday ? { boxShadow: "0 6px 20px -8px var(--gold-glow)" } : undefined}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.6px]"
                style={{ color: isToday ? "var(--gold-text)" : "var(--text-muted)" }}
              >
                {WEEKDAY_SHORT[weekdayOf(d)]}
              </span>
              <span
                className={isToday ? "text-[20px] font-bold" : "text-[18px] font-semibold"}
                style={{ color: isToday ? "var(--gold-text)" : isFuture ? "var(--text-secondary)" : "var(--text)" }}
              >
                {dayNum}
              </span>
              <span className="flex h-1 gap-[3px]" aria-hidden="true">
                {required.length === 0 ? (
                  <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                ) : (
                  required.map((h) => (
                    <span
                      key={h.id}
                      className="h-1 w-1 rounded-full"
                      style={{ background: !isFuture && done?.has(h.id) ? colorFor(h.color) : "var(--border)" }}
                    />
                  ))
                )}
              </span>
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden min-w-[160px] max-w-[220px] -translate-x-1/2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left group-hover:block group-focus-within:block"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--text-muted)]">
                {isToday ? "Today" : isFuture ? "Upcoming" : "Past"} · {required.length} habit{required.length === 1 ? "" : "s"}
              </div>
              {required.length === 0 ? (
                <div className="text-[12px] text-[var(--text-secondary)]">Nothing scheduled</div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {required.map((h) => (
                    <li key={h.id} className="flex items-center gap-2 text-[12px] text-[var(--text)]">
                      <span className="h-[6px] w-[6px] flex-none rounded-full" style={{ background: colorFor(h.color) }} />
                      <span className="truncate">{h.name}</span>
                      {!isFuture && done?.has(h.id) && <span className="ml-auto text-[var(--gold-text)]">✓</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
