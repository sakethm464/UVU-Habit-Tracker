import { HabitIcon } from "@/components/ui/HabitIcon";
import { colorFor, isRequiredOn, WEEKDAY_LETTER } from "@/lib/habits";
import type { Habit } from "@/lib/types";

export function HabitCard({ habit, onEdit }: { habit: Habit; onEdit: () => void }) {
  const c = colorFor(habit.color);
  return (
    <div
      className="flex flex-col gap-[18px] rounded-[20px] border p-[22px]"
      style={{
        background: `color-mix(in srgb, ${c} 10%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${c} 25%, transparent)`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start gap-4">
        <span
          className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-[14px]"
          style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}
        >
          <HabitIcon name={habit.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-bold">{habit.name}</h3>
          {habit.description && <p className="mt-1 line-clamp-2 text-[13px] text-[var(--text-secondary)]">{habit.description}</p>}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${habit.name}`}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-border)] hover:text-[var(--text)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex gap-[6px]" aria-label="Active days">
        {WEEKDAY_LETTER.map((letter, d) => {
          const active = isRequiredOn(habit, d);
          return (
            <span
              key={d}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold"
              style={
                active
                  ? { background: `color-mix(in srgb, ${c} 20%, transparent)`, borderColor: `color-mix(in srgb, ${c} 55%, transparent)`, color: c }
                  : { background: "var(--bg)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }
              }
            >
              {letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}
