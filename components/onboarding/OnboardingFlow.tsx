"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from "@/components/ui/icons";

const STEPS = [
  {
    eyebrow: "STEP 1 · MAKE",
    title: ["Make the habit", "you want to", "track."],
    body: "Name it, pick a color, and choose the days it runs on. Daily, or just the days you actually show up.",
    visual: "make",
  },
  {
    eyebrow: "STEP 2 · COMPLETE",
    title: ["Scratch it off", "your day", "when done."],
    body: "Tap a habit to check it off. It saves to your timeline automatically.",
    visual: "complete",
  },
  {
    eyebrow: "STEP 3 · TRACK",
    title: ["Fill your timeline", "with color to earn", "your UVU streak."],
    body: "Every completed day fills in on your timeline. Complete everything on schedule and your Daily and Weekly UVU streaks grow.",
    visual: "track",
  },
] as const;

type Visual = (typeof STEPS)[number]["visual"];

export function OnboardingFlow() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const go = (n: number) => {
    setDir(n > i ? 1 : -1);
    setI(n);
  };

  return (
    <div className="page-glow flex min-h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between px-14 py-6">
        <Logo href="/welcome" />
        <div className="flex items-center gap-6">
          <Link href="/signup" className="text-[14px] text-[var(--text-secondary)] no-underline hover:text-[var(--text)]">
            Skip →
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] border border-[var(--border)] px-4 py-2 text-[14px] font-medium text-[var(--text)] no-underline hover:border-[var(--gold-border)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 items-center px-14">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={i}
            custom={dir}
            initial={reduce ? false : { opacity: 0, x: 24 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 * dir }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="grid w-full grid-cols-2 items-center gap-14"
          >
            <section>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-soft)] px-3 py-[6px] text-[12px] font-semibold tracking-[0.3px] text-[var(--gold-text)]">
                {step.eyebrow}
              </span>
              <h1 className="mb-5 text-[52px] font-extrabold leading-[1.05] tracking-[-1.5px]">
                {step.title.map((line, k) => (
                  <span key={k} className={k === step.title.length - 1 ? "text-gold" : ""}>
                    {line}
                    {k < step.title.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="max-w-[460px] text-[17px] leading-[1.55] text-[var(--text-secondary)]">{step.body}</p>
            </section>
            <section aria-hidden="true" className="flex justify-center">
              <Preview kind={step.visual} />
            </section>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-between px-14 pb-8 pt-6">
        <div className="w-40">
          {i > 0 && (
            <Button variant="ghost" onClick={() => go(i - 1)}>
              <ChevronLeftIcon /> Back
            </Button>
          )}
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Onboarding progress">
          {STEPS.map((_, k) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === i}
              aria-label={`Step ${k + 1}`}
              onClick={() => go(k)}
              className="h-[6px] rounded-[3px] transition-all duration-300"
              style={{
                width: k === i ? 32 : 8,
                background:
                  k === i ? "linear-gradient(90deg, var(--gold-from), var(--gold-to))" : "var(--border)",
              }}
            />
          ))}
        </div>
        <div className="flex w-40 justify-end">
          {last ? (
            <ButtonLink href="/signup" size="lg">
              Let&apos;s get started! <ArrowRightIcon />
            </ButtonLink>
          ) : (
            <Button onClick={() => go(i + 1)}>
              Continue <ChevronRightIcon size={14} />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

/* -------- Illustrative previews (static, sample data; mirrors the mock cards) -------- */

function HabitRow({ name, meta, color, done }: { name: string; meta: string; color: string; done?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] border px-[14px] py-3"
      style={{
        background: `color-mix(in srgb, ${color} 10%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      <span
        className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="15" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 20l3-5 4 2 2-6 5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{name}</div>
        <div className="text-[11px] text-[var(--text-secondary)]">{meta}</div>
      </div>
      <span
        className={
          "inline-flex h-[22px] w-[22px] items-center justify-center rounded-[8px] " +
          (done ? "bg-gold" : "border-[1.5px] border-[var(--border)]")
        }
      >
        {done && <CheckIcon size={12} strokeWidth={3.2} />}
      </span>
    </div>
  );
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function Preview({ kind }: { kind: Visual }) {
  const card =
    "w-[420px] rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-[var(--shadow-elevated)]";
  if (kind === "make") {
    return (
      <div className={card}>
        <div className="mb-4 text-[11px] uppercase tracking-[0.4px] text-[var(--text-muted)]">New habit</div>
        <div className="mb-4 rounded-[12px] border border-[var(--border)] px-4 py-3 text-[15px]">Morning run</div>
        <div className="mb-2 text-[12px] text-[var(--text-secondary)]">Days</div>
        <div className="mb-4 flex gap-2">
          {DAYS.map((d, k) => {
            const on = k === 1 || k === 3 || k === 5;
            return (
              <span
                key={k}
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border text-[12px] font-bold"
                style={
                  on
                    ? {
                        background: "color-mix(in srgb, var(--habit-coral) 18%, transparent)",
                        borderColor: "color-mix(in srgb, var(--habit-coral) 50%, transparent)",
                        color: "var(--habit-coral)",
                      }
                    : { borderColor: "var(--border)", color: "var(--text-muted)" }
                }
              >
                {d}
              </span>
            );
          })}
        </div>
        <HabitRow name="Morning run" meta="Mon · Wed · Fri" color="var(--habit-coral)" />
      </div>
    );
  }
  if (kind === "complete") {
    return (
      <div className={card}>
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-[0.4px] text-[var(--text-muted)]">Today</div>
          <div className="text-gold text-[20px] font-bold">Your habits</div>
        </div>
        <div className="flex flex-col gap-2">
          <HabitRow name="Drink water" meta="Daily" color="var(--habit-teal)" done />
          <HabitRow name="Morning run" meta="Mon · Wed · Fri" color="var(--habit-coral)" done />
          <HabitRow name="Read 30 minutes" meta="Daily" color="var(--habit-lilac)" />
        </div>
      </div>
    );
  }
  const fills = [0.9, 0.9, 0.15, 0.9, 0.9, 0.9, 0.15, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9];
  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[13px] font-semibold">Morning run</div>
        <div className="text-[11px] font-semibold" style={{ color: "var(--habit-coral)" }}>
          Filling in
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {fills.map((o, k) => (
          <span
            key={k}
            className="aspect-square rounded-[6px]"
            style={{ background: `color-mix(in srgb, var(--habit-coral) ${o * 100}%, transparent)` }}
          />
        ))}
      </div>
    </div>
  );
}
