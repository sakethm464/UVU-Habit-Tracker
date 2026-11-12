"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PlusIcon } from "@/components/ui/icons";
import { archiveHabit, createHabit, updateHabit } from "@/lib/data/habits";
import type { HabitInput } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { HabitCard } from "./HabitCard";
import { HabitForm } from "./HabitForm";

type Editing = { mode: "create" } | { mode: "edit"; habit: Habit } | null;

export function HabitsView({ habits }: { habits: Habit[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);

  async function done() {
    close();
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 md:gap-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.6px] md:text-[30px]">Manage Habits</h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            {habits.length === 0 ? "Nothing here yet." : `${habits.length} active habit${habits.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button onClick={() => setEditing({ mode: "create" })} className="w-full md:w-auto">
          <PlusIcon /> Create New Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="relative flex flex-col items-center gap-4 rounded-[20px] border border-dashed border-[var(--border)] px-5 py-12 text-center md:px-8 md:py-16">
          {/* Arrow pointing up at the "Create New Habit" button in the page header (desktop: top right). */}
          <div
            aria-hidden="true"
            className="absolute right-[60px] top-4 hidden flex-col items-center gap-1 text-[var(--gold-text)] motion-safe:animate-bounce md:flex"
          >
            <svg width="40" height="56" viewBox="0 0 40 56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 54 V6" />
              <path d="M8 18 L20 5 L32 18" />
            </svg>
            <span className="text-[12px] font-semibold">Start here</span>
          </div>
          <h2 className="text-[20px] font-bold">Create your first habit</h2>
          <p className="max-w-[360px] text-[14px] text-[var(--text-secondary)]">
            Name it, pick the days it runs on, and choose a color. It will show up on Today. Tap{" "}
            <strong className="text-[var(--text)]">Create New Habit</strong> <span className="md:hidden">above</span>
            <span className="hidden md:inline">at the top right</span> to begin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} onEdit={() => setEditing({ mode: "edit", habit: h })} />
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={close} title={editing?.mode === "edit" ? "Edit habit" : "Create new habit"}>
        {editing && (
          <HabitForm
            key={editing.mode === "edit" ? editing.habit.id : "new"}
            habit={editing.mode === "edit" ? editing.habit : undefined}
            onCancel={close}
            onSubmit={async (input: HabitInput) => {
              if (editing.mode === "edit") await updateHabit(editing.habit.id, input, editing.habit.name);
              else await createHabit(input);
              await done();
            }}
            onArchive={
              editing.mode === "edit"
                ? async () => {
                    await archiveHabit(editing.habit.id);
                    await done();
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  );
}
