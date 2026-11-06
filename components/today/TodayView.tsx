"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { setCompletion } from "@/lib/data/completions";
import { habitsForDate } from "@/lib/habits";
import { localDateString } from "@/lib/timezone";
import type { Habit } from "@/lib/types";
import { NotificationPrompt } from "./NotificationPrompt";
import { StreakBadges, type StreakSummary } from "./StreakBadges";
import { TodayHabitCard } from "./TodayHabitCard";
import { WeekRibbon } from "./WeekRibbon";

type Props = {
  userId: string;
  greeting: string;
  dateLabel: string;
  timezone: string;
  today: string;
  habits: Habit[];
  completions: { habit_id: string; completed_for: string }[];
  streaks: StreakSummary | null;
  pushEnabled: boolean;
};

function formatDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

export function TodayView({ userId, greeting, dateLabel, timezone, today, habits, completions, streaks, pushEnabled }: Props) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // "Today" is user-local. If midnight passes while the page is open, reload server data.
  useEffect(() => {
    const id = setInterval(() => {
      if (localDateString(timezone) !== today) {
        setOverrides({});
        router.refresh();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [timezone, today, router]);

  const completedByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const c of completions) (map[c.completed_for] ??= new Set()).add(c.habit_id);
    const t = (map[today] = new Set(map[today] ?? []));
    for (const [id, v] of Object.entries(overrides)) {
      if (v) t.add(id);
      else t.delete(id);
    }
    return map;
  }, [completions, overrides, today]);

  const [selected, setSelected] = useState(today);
  useEffect(() => setSelected(today), [today]);
  const isToday = selected === today;
  const isFuture = selected > today;

  const todays = useMemo(() => habitsForDate(habits, selected, timezone), [habits, selected, timezone]);
  const doneToday = completedByDate[selected] ?? new Set<string>();
  const doneCount = todays.filter((h) => doneToday.has(h.id)).length;
  const pct = todays.length ? Math.round((doneCount / todays.length) * 100) : 0;

  async function toggle(h: Habit) {
    if (!isToday) return;
    const next = !doneToday.has(h.id);
    setError(null);
    setOverrides((o) => ({ ...o, [h.id]: next }));
    setPending((p) => new Set(p).add(h.id));
    try {
      await setCompletion(h.id, userId, today, next);
      router.refresh(); // streaks recompute server-side
    } catch (e) {
      setOverrides((o) => ({ ...o, [h.id]: !next })); // roll back
      setError(e instanceof Error ? e.message : "Couldn't save that. Try again.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(h.id);
        return n;
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-7">
      <div className="flex items-center justify-between gap-6">
        <div>
          <div className="mb-1 text-[13px] text-[var(--text-secondary)]">{dateLabel}</div>
          <h1 className="text-[30px] font-bold tracking-[-0.6px]">{greeting}</h1>
        </div>
        <div className="flex items-center gap-[10px]">
          <StreakBadges streaks={streaks} />
          <ButtonLink href="/habits">
            <PlusIcon /> New habit
          </ButtonLink>
        </div>
      </div>

      <NotificationPrompt userId={userId} pushEnabled={pushEnabled} />

      <WeekRibbon today={today} timezone={timezone} habits={habits} completedByDate={completedByDate} selected={selected} onSelect={setSelected} />

      {habits.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[20px] border border-dashed border-[var(--border)] px-8 py-16 text-center">
          <h2 className="text-[20px] font-bold">Create your first habit</h2>
          <p className="max-w-[360px] text-[14px] text-[var(--text-secondary)]">
            Habits you schedule for today show up here to scratch off.
          </p>
          <ButtonLink href="/habits">
            <PlusIcon /> Create your first habit
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-[20px] font-bold tracking-[-0.3px]">
                {isToday ? "Today's habits" : formatDay(selected)}
              </h2>
              {!isToday && (
                <button type="button" onClick={() => setSelected(today)} className="text-[13px] font-semibold text-[var(--gold-text)]">
                  Back to today
                </button>
              )}
              {todays.length > 0 && !isFuture && (
                <span className="text-[14px] text-[var(--text-secondary)]">
                  {doneCount} of {todays.length} complete · {pct}%
                </span>
              )}
            </div>
            {todays.length > 0 && !isFuture && (
              <div className="h-[6px] w-[180px] overflow-hidden rounded-[3px] bg-[var(--ring-track)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Today's progress">
                <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-[12px] border border-[var(--habit-coral)]/40 bg-[var(--habit-coral)]/10 px-4 py-3 text-[13px] text-[var(--habit-coral)]">
              {error}
            </p>
          )}

          {todays.length === 0 ? (
            <p className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-8 text-center text-[14px] text-[var(--text-secondary)]">
              Nothing scheduled {isToday ? "today" : "this day"}. <Link href="/habits" className="font-semibold text-[var(--gold-text)]">Manage habits</Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {todays.map((h) => (
                <TodayHabitCard key={h.id} habit={h} done={doneToday.has(h.id)} readOnly={!isToday} pending={pending.has(h.id)} onToggle={() => toggle(h)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
