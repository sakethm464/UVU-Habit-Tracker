"use client";

import { useTheme } from "@/components/ui/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Segmented control (mirrors the Week/Month toggle style in the mocks). */
export function ThemeToggle({ onChange }: { onChange?: (t: ThemePreference) => void }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="inline-flex gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1"
    >
      {OPTIONS.map((o) => {
        const on = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              setTheme(o.value);
              onChange?.(o.value);
            }}
            className={
              "rounded-[9px] border px-[14px] py-[7px] text-[13px] transition-colors " +
              (on
                ? "border-[var(--gold-border)] bg-[var(--gold-soft)] font-bold text-[var(--gold-text)]"
                : "border-transparent font-medium text-[var(--text-secondary)] hover:text-[var(--text)]")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
