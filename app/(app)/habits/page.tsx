import { HabitsView } from "@/components/habits/HabitsView";
import { createClient } from "@/lib/supabase/server";
import type { Habit } from "@/lib/types";

export const metadata = { title: "Manage Habits · UVU" };

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("habits")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  return <HabitsView habits={(data ?? []) as Habit[]} />;
}
