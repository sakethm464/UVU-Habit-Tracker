import { AuthShell, SetupNotice } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "New password · UVU" };

// Reached from the recovery email via /auth/callback, which establishes the session first.
export default function ResetPasswordPage() {
  return <AuthShell>{hasSupabaseEnv() ? <ResetPasswordForm /> : <SetupNotice />}</AuthShell>;
}
