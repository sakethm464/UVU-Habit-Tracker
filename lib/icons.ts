// Static icon set + keyword matcher. Per 03-UX-AND-BUILD.md the icon is auto-assigned from the
// habit name (no picker, no runtime AI). Rendering lives in components/ui/HabitIcon.tsx.

export const ICON_KEYS = [
  "water", "run", "book", "meditate", "journal", "workout", "sleep", "food", "walk",
  "code", "music", "heart", "sun", "money", "clean", "star",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];
export const DEFAULT_ICON: IconKey = "star";

// Order matters: first match wins.
const KEYWORDS: [IconKey, string[]][] = [
  ["water", ["water", "hydrat", "drink", "glass"]],
  ["meditate", ["meditat", "mindful", "breath", "yoga", "pray"]],
  ["workout", ["workout", "gym", "lift", "weights", "strength", "pushup", "push-up", "pull-up", "exercise", "stretch"]],
  ["run", ["run", "jog", "cardio", "sprint"]],
  ["walk", ["walk", "steps", "hike"]],
  ["book", ["read", "book", "novel", "chapter"]],
  ["journal", ["journal", "write", "diary", "gratitude", "note"]],
  ["sleep", ["sleep", "bed", "nap", "wake"]],
  ["food", ["eat", "meal", "fruit", "veg", "diet", "cook", "breakfast", "lunch", "dinner", "protein"]],
  ["code", ["code", "coding", "program", "leetcode", "dev"]],
  ["music", ["music", "guitar", "piano", "sing", "practice", "instrument"]],
  ["money", ["save", "budget", "money", "invest", "spend"]],
  ["clean", ["clean", "tidy", "laundry", "dish", "declutter", "make bed"]],
  ["sun", ["sun", "outside", "outdoor", "morning", "fresh air"]],
  ["heart", ["call", "family", "friend", "love", "kind", "date", "health"]],
];

export function isIconKey(v: unknown): v is IconKey {
  return typeof v === "string" && (ICON_KEYS as readonly string[]).includes(v);
}

export function pickIcon(name: string): IconKey {
  const n = name.toLowerCase();
  for (const [key, words] of KEYWORDS) {
    if (words.some((w) => n.includes(w))) return key;
  }
  return DEFAULT_ICON;
}
