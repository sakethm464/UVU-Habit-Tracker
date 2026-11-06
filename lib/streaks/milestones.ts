/** Daily UVU milestones: 7, 30, then every +30 (60, 90, 120, ...). */
export function isDailyMilestone(n: number): boolean {
  return n === 7 || (n >= 30 && n % 30 === 0);
}

/** Weekly UVU milestones: every +4 weeks (4, 8, 12, ...). */
export function isWeeklyMilestone(n: number): boolean {
  return n >= 4 && n % 4 === 0;
}

export function milestoneMessage(kind: "daily" | "weekly", n: number): string {
  return `🔥 ${n}-${kind === "daily" ? "day" : "week"} UVU! Keep it going.`;
}

export const STREAK_BROKEN_MESSAGE = "You missed a habit today — your UVU is reset. Ready to start again tomorrow?";
