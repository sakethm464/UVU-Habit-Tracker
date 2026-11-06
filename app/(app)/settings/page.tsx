import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings/SettingsView";
import { ensureProfile } from "@/lib/data/profile.server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings · UVU" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);
  if (!profile) {
    return <p role="alert" className="text-[14px] text-[var(--text-secondary)]">Couldn&apos;t load your profile. Refresh to try again.</p>;
  }

  return <SettingsView profile={profile} email={user.email ?? ""} />;
}
