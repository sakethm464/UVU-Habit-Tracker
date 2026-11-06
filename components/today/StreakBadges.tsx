export type StreakSummary = {
  /** null when the user has no daily habits (Daily UVU doesn't exist then). */
  daily: number | null;
  weekly: number;
};

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--gold-border)] bg-[var(--gold-soft)] px-[14px] py-[10px]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--gold-text)" }}>
        <path d="M12 2s-2 3-2 5 1 3 2 3 2-1 2-3-2-5-2-5zM6 11c0 5 2 9 6 11 4-2 6-6 6-11-2 1-4 1-6-1-2 2-4 2-6 1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span className="text-[13px] font-semibold text-[var(--gold-text)]">
        {value} · {label}
      </span>
    </div>
  );
}

/** Headline metrics: Daily UVU (only if the user has a daily habit) + Weekly UVU. */
export function StreakBadges({ streaks }: { streaks: StreakSummary | null }) {
  if (!streaks) return null;
  return (
    <div className="flex items-center gap-2" aria-label="Your UVU streaks">
      {streaks.daily !== null && <Badge label="Daily UVU" value={streaks.daily} />}
      <Badge label="Weekly UVU" value={streaks.weekly} />
    </div>
  );
}
