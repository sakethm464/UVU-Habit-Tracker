"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { CheckIcon } from "@/components/ui/icons";
import { colorFor, frequencyLabel } from "@/lib/habits";
import type { Habit } from "@/lib/types";

type Props = { habit: Habit; done: boolean; pending?: boolean; readOnly?: boolean; onToggle: () => void };

export function TodayHabitCard({ habit, done, pending, readOnly, onToggle }: Props) {
  const c = colorFor(habit.color);
  const reduce = useReducedMotion();
  return (
    <div
      className="flex items-center gap-4 rounded-[16px] border px-5 py-4 transition-colors"
      style={{
        background: `color-mix(in srgb, ${c} ${done ? 14 : 10}%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${c} 25%, transparent)`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <span
        className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-[14px]"
        style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}
      >
        <HabitIcon name={habit.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={"mb-1 truncate text-[15px] font-semibold " + (done ? "text-[var(--text-secondary)] line-through decoration-[1.5px]" : "")}>
          {habit.name}
        </div>
        <div className="truncate text-[12px] text-[var(--text-secondary)]">{habit.description || frequencyLabel(habit)}</div>
      </div>
      {readOnly ? (
        <span
          aria-label={done ? "Completed" : "Not completed"}
          className={
            "inline-flex h-7 w-7 flex-none items-center justify-center rounded-[10px] border-[1.5px] " +
            (done ? "bg-gold border-[var(--gold-from)]" : "border-[var(--border)] bg-[var(--surface)] opacity-50")
          }
        >
          {done && <CheckIcon size={14} />}
        </span>
      ) : (
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? "Unmark" : "Mark"} ${habit.name} as done today`}
        disabled={pending}
        onClick={onToggle}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        animate={reduce ? undefined : { scale: done ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 0.25 }}
        className={
          "inline-flex h-7 w-7 flex-none items-center justify-center rounded-[10px] border-[1.5px] " +
          (done ? "bg-gold border-[var(--gold-from)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--gold-border)]")
        }
      >
        {done && <CheckIcon size={14} />}
      </motion.button>
      )}
    </div>
  );
}
