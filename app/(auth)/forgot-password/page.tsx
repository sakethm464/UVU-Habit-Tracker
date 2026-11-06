import { AuthShell, SetupNotice } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Reset password · UVU" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell prompt="Remembered it?" linkLabel="Sign in" linkHref="/login">
      {hasSupabaseEnv() ? <ForgotPasswordForm /> : <SetupNotice />}
    </AuthShell>
  );
}
