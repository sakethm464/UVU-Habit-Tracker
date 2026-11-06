import { createClient } from "@/lib/supabase/client";
import { pickIcon } from "@/lib/icons";
import { validateHabit, type HabitInput } from "@/lib/habits";
import type { Habit } from "@/lib/types";

// Browser-side habit operations (RLS enforces ownership). Callers refresh server data afterwards.

function normalize(i: HabitInput) {
  return {
    name: i.name.trim(),
    description: i.description.trim() || null,
    color: i.color,
    frequency_type: i.frequency_type,
    active_days: i.frequency_type === "daily" ? null : [...new Set(i.active_days)].sort((a, b) => a - b),
  };
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const invalid = validateHabit(input);
  if (invalid) throw new Error(invalid);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You're signed out. Please sign in again.");

  const row = normalize(input);
  const { data, error } = await supabase
    .from("habits")
    .insert({ ...row, user_id: user.id, icon: pickIcon(row.name) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Habit;
}

export async function updateHabit(id: string, input: HabitInput, previousName?: string): Promise<void> {
  const invalid = validateHabit(input);
  if (invalid) throw new Error(invalid);
  const row = normalize(input);
  // Re-derive the icon only when the name changed.
  const patch = previousName !== undefined && previousName !== row.name ? { ...row, icon: pickIcon(row.name) } : row;
  const { error } = await createClient().from("habits").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Soft delete: Timeline history survives. */
export async function archiveHabit(id: string): Promise<void> {
  const { error } = await createClient().from("habits").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}
