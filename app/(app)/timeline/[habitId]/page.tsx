import Link from "next/link";
import { notFound } from "next/navigation";
import { CellGrid } from "@/components/timeline/CellGrid";
import { ConsistencyRing } from "@/components/timeline/ConsistencyRing";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { loadTimelineContext } from "@/lib/data/timeline.server";
import { colorFor, frequencyLabel } from "@/lib/habits";
import { computeConsistency } from "@/lib/streaks";
import { buildCells } from "@/lib/timeline";

export const metadata = { title: "Habit · UVU" };

export default async function HabitDetailPage({ params }: { params: Promise<{ habitId: string }> }) {
  const { habitId } = await params;
  const { habits, scheduled, done, today } = await loadTimelineContext();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) notFound();

  const s = scheduled.get(habit.id)!;
  const c = colorFor(habit.color);

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-7">
      <Link href="/timeline" className="inline-flex w-fit items-center gap-1 text-[14px] text-[var(--text-secondary)] no-underline hover:text-[var(--text)]">
        <ChevronLeftIcon size={14} /> Timeline
      </Link>

      <div className="flex items-center gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-[16px]" style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
          <HabitIcon name={habit.icon} size={26} />
        </span>
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px]">{habit.name}</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">{habit.description || frequencyLabel(habit)}</p>
        </div>
      </div>

      <section aria-label="Consistency" className="grid grid-cols-3 gap-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
        {(["week", "month", "year"] as const).map((w) => (
          <ConsistencyRing key={w} pct={computeConsistency(s, done, today, w).pct} label={w === "week" ? "Weekly" : w === "month" ? "Monthly" : "Yearly"} />
        ))}
      </section>
      <p className="-mt-3 text-[12px] text-[var(--text-muted)]">
        Consistency = completed ÷ scheduled days over the last 7, 30 and 365 days. It is a view, not a streak.
      </p>

      <section aria-label="Last 30 days" className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
        <h2 className="mb-4 text-[14px] font-semibold text-[var(--text-secondary)]">Last 30 days</h2>
        <CellGrid cells={buildCells(s, done, today, 30)} color={c} columns={15} />
      </section>
    </div>
  );
}
