import { TimelineView, type TimelineRow } from "@/components/timeline/TimelineView";
import { loadTimelineContext } from "@/lib/data/timeline.server";
import { computeConsistency } from "@/lib/streaks";
import { buildCells } from "@/lib/timeline";

export const metadata = { title: "Timeline · UVU" };

export default async function TimelinePage() {
  const { habits, scheduled, done, today } = await loadTimelineContext();

  const rows: TimelineRow[] = habits.map((habit) => {
    const s = scheduled.get(habit.id)!;
    return {
      habit,
      cells: buildCells(s, done, today, 30),
      weekPct: computeConsistency(s, done, today, "week").pct,
      monthPct: computeConsistency(s, done, today, "month").pct,
    };
  });

  return <TimelineView rows={rows} />;
}
