import { redirect } from "next/navigation";
import { TodayView } from "@/components/today/TodayView";
import { getStreaks } from "@/lib/data/streaks.server";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatLongDate, hourInTimeZone, localDateString } from "@/lib/timezone";
import type { Completion, Habit, Profile } from "@/lib/types";

export const metadata = { title: "Today · UVU" };

function greetingFor(hour: number, name: string) {
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}`;
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  const profile = profileRow as Profile | null;
  const timezone = profile?.timezone ?? "UTC";
  const today = localDateString(timezone);

  const [{ data: habitRows }, { data: completionRows }, streaks] = await Promise.all([
    supabase.from("habits").select("*").is("archived_at", null).order("created_at", { ascending: true }),
    supabase.from("completions").select("habit_id, completed_for").gte("completed_for", addDays(today, -28)).lte("completed_for", today),
    getStreaks(supabase, { timezone, weekStart: profile?.week_start ?? 0, today }),
  ]);
  const hasHabits = (habitRows ?? []).length > 0;

  const name = profile?.display_name || (user.email ?? "there").split("@")[0];

  return (
    <TodayView
      userId={user.id}
      greeting={greetingFor(hourInTimeZone(timezone), name)}
      dateLabel={formatLongDate(today)}
      timezone={timezone}
      today={today}
      habits={(habitRows ?? []) as Habit[]}
      completions={(completionRows ?? []) as Pick<Completion, "habit_id" | "completed_for">[]}
      pushEnabled={profile?.push_enabled ?? false}
      streaks={hasHabits ? streaks : null /* Weekly UVU shows whenever the user has any habit */}
    />
  );
}
