export type FrequencyType = "daily" | "specific_days";

export type Profile = {
  user_id: string;
  display_name: string | null;
  timezone: string;
  push_enabled: boolean;
  theme: "light" | "dark" | "system";
  week_start: number; // 0=Sun..6=Sat
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  frequency_type: FrequencyType;
  active_days: number[] | null; // 0=Sun..6=Sat, when specific_days
  created_at: string;
  archived_at: string | null;
};

export type Completion = {
  id: string;
  habit_id: string;
  user_id: string;
  completed_for: string; // YYYY-MM-DD, user-local
  completed_at: string;
};
