import { AuthShell, SetupNotice } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Sign up · UVU" };

export default function SignupPage() {
  return (
    <AuthShell prompt="Already have an account?" linkLabel="Sign in" linkHref="/login">
      {hasSupabaseEnv() ? <SignupForm /> : <SetupNotice />}
    </AuthShell>
  );
}
