"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CheckIcon } from "@/components/ui/icons";
import { ALL_DAYS, DEFAULT_COLOR, HABIT_COLORS, WEEKDAY_SHORT, validateHabit, type HabitInput } from "@/lib/habits";
import type { Habit } from "@/lib/types";

type Props = {
  habit?: Habit;
  onSubmit: (input: HabitInput) => Promise<void>;
  onArchive?: () => Promise<void>;
  onCancel: () => void;
};

export function HabitForm({ habit, onSubmit, onArchive, onCancel }: Props) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [color, setColor] = useState(habit?.color ?? DEFAULT_COLOR);
  const [frequency, setFrequency] = useState<HabitInput["frequency_type"]>(habit?.frequency_type ?? "daily");
  const [days, setDays] = useState<number[]>(habit?.active_days ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  async function run(fn: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPending(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: HabitInput = { name, description, color, frequency_type: frequency, active_days: days };
    const invalid = validateHabit(input);
    if (invalid) return setError(invalid);
    run(() => onSubmit(input));
  }

  const chipBase = "rounded-[12px] border px-4 py-[10px] text-[13px] font-semibold transition-colors";
  const on = "border-[var(--gold-border)] bg-[var(--gold-soft)] text-[var(--gold-text)]";
  const off = "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]";

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <h2 className="text-[22px] font-bold tracking-[-0.4px]">{habit ? "Edit habit" : "Create new habit"}</h2>

      <TextField label="Habit name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning run" autoFocus />

      <div className="flex flex-col gap-2">
        <label htmlFor="habit-desc" className="text-[12px] font-medium tracking-[0.3px] text-[var(--text-secondary)]">
          Description <span className="text-[var(--text-muted)]">(optional)</span>
        </label>
        <textarea
          id="habit-desc"
          value={description}
          maxLength={500}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full resize-none rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-border)]"
          placeholder="Why it matters, or what counts"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-[12px] font-medium tracking-[0.3px] text-[var(--text-secondary)]">Consistency level</legend>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFrequency("daily")} aria-pressed={frequency === "daily"} className={`${chipBase} ${frequency === "daily" ? on : off}`}>
            Every day
          </button>
          <button type="button" onClick={() => setFrequency("specific_days")} aria-pressed={frequency === "specific_days"} className={`${chipBase} ${frequency === "specific_days" ? on : off}`}>
            Specific days
          </button>
        </div>
        {frequency === "specific_days" && (
          <div className="flex gap-2" role="group" aria-label="Days of the week">
            {ALL_DAYS.map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  aria-label={WEEKDAY_SHORT[d]}
                  onClick={() => toggleDay(d)}
                  className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border text-[12px] font-bold transition-colors"
                  style={
                    active
                      ? { background: "color-mix(in srgb, var(--hc) 18%, transparent)", borderColor: "color-mix(in srgb, var(--hc) 50%, transparent)", color: "var(--hc)", ["--hc" as string]: HABIT_COLORS.find((c) => c.hex === color)?.cssVar ?? color }
                      : { borderColor: "var(--border)", color: "var(--text-muted)" }
                  }
                >
                  {WEEKDAY_SHORT[d].slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[12px] font-medium tracking-[0.3px] text-[var(--text-secondary)]">Color</legend>
        <div className="flex gap-3" role="radiogroup" aria-label="Color">
          {HABIT_COLORS.map((c) => {
            const selected = c.hex.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.name}
                onClick={() => setColor(c.hex)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: c.cssVar,
                  color: "#fff",
                  boxShadow: selected ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.cssVar}` : undefined,
                }}
              >
                {selected && <CheckIcon size={14} />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-[12px] border border-[var(--habit-coral)]/40 bg-[var(--habit-coral)]/10 px-4 py-3 text-[13px] text-[var(--habit-coral)]">
          {error}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between gap-3">
        <div>
          {habit && onArchive &&
            (confirmArchive ? (
              <span className="flex items-center gap-2 text-[13px]">
                <span className="text-[var(--text-secondary)]">Archive this habit?</span>
                <Button variant="secondary" disabled={pending} onClick={() => run(onArchive)} className="!text-[var(--habit-coral)]">
                  Yes, archive
                </Button>
                <Button variant="ghost" onClick={() => setConfirmArchive(false)}>
                  No
                </Button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmArchive(true)} className="!text-[var(--habit-coral)]">
                Archive
              </Button>
            ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : habit ? "Save changes" : "Create habit"}
          </Button>
        </div>
      </div>
    </form>
  );
}
