import type { Cell } from "@/lib/timeline";

const LABEL: Record<Cell["state"], string> = {
  done: "completed",
  missed: "missed",
  pending: "not done yet",
  off: "not scheduled",
};

/** Color-coded grid of days: filled = completed, empty = missed, faint = not scheduled. */
export function CellGrid({ cells, color, columns }: { cells: Cell[]; color: string; columns: number }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} role="img" aria-label="Completion history">
      {cells.map((c) => (
        <span
          key={c.day}
          title={`${c.day} · ${LABEL[c.state]}`}
          className="aspect-square rounded-[6px] border"
          style={
            c.state === "done"
              ? { background: `color-mix(in srgb, ${color} 90%, transparent)`, borderColor: "transparent" }
              : c.state === "missed"
                ? { background: `color-mix(in srgb, ${color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }
                : c.state === "pending"
                  ? { background: "transparent", borderColor: color, borderStyle: "dashed" }
                  : { background: "var(--border-subtle)", borderColor: "transparent", opacity: 0.45 }
          }
        />
      ))}
    </div>
  );
}
