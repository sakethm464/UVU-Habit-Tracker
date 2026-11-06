"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  /** 0-100, or null when nothing was required in the window */
  pct: number | null;
  size?: number;
  stroke?: number;
  /** CSS color for the arc; defaults to the gold gradient */
  color?: string;
  label?: string;
};

/** Animated fill circle. View-only metric. */
export function ConsistencyRing({ pct, size = 120, stroke = 10, color, label }: Props) {
  const reduce = useReducedMotion();
  const gid = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, pct ?? 0));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? "Consistency"}: ${pct === null ? "no data" : pct + "%"}`}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--gold-from)" />
              <stop offset="1" stopColor="var(--gold-to)" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color ?? `url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            initial={{ strokeDashoffset: reduce ? c * (1 - value / 100) : c }}
            animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gold font-extrabold tabular-nums" style={{ fontSize: size * 0.26 }}>
            {pct === null ? "–" : `${pct}%`}
          </span>
        </div>
      </div>
      {label && <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--text-muted)]">{label}</span>}
    </div>
  );
}
