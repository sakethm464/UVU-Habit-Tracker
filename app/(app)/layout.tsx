import { redirect } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeSync } from "@/components/settings/ThemeSync";
import { SetupNotice } from "@/components/auth/AuthShell";
import { ensureProfile } from "@/lib/data/profile.server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic"; // always per-request: reads the session cookie

// Authenticated shell: desktop sidebar + content. proxy.ts already redirects guests; this is the backstop.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <SetupNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);
  const name = profile?.display_name || (user.email ?? "You").split("@")[0];

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <MobileNav name={name} email={user.email ?? ""} />
      <Sidebar name={name} email={user.email ?? ""} />
      <div className="min-w-0 flex-1 px-4 pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-12 md:pb-12 md:pt-8">
        <ThemeSync profileTheme={profile?.theme ?? "system"} />
        {children}
      </div>
    </div>
  );
}
