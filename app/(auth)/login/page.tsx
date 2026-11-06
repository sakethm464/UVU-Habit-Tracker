import { Suspense } from "react";
import { AuthShell, SetupNotice } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Sign in · UVU" };

export default function LoginPage() {
  return (
    <AuthShell prompt="New here?" linkLabel="Create account" linkHref="/signup">
      {hasSupabaseEnv() ? (
        <Suspense>
          <LoginForm />
        </Suspense>
      ) : (
        <SetupNotice />
      )}
    </AuthShell>
  );
}
