import { createClient } from "@/lib/supabase/client";

/**
 * Mark/unmark a habit for `day` (must be the user's local today: no backfill, also enforced by a DB trigger).
 * `done` is the desired end state; the operation is idempotent.
 */
export async function setCompletion(habitId: string, userId: string, day: string, done: boolean): Promise<void> {
  const supabase = createClient();
  if (done) {
    const { error } = await supabase
      .from("completions")
      .upsert({ habit_id: habitId, user_id: userId, completed_for: day }, { onConflict: "habit_id,completed_for", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("completions").delete().eq("habit_id", habitId).eq("completed_for", day);
    if (error) throw new Error(error.message);
  }
}
