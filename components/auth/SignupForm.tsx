"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getBrowserTimeZone, weekdayInTimeZone } from "@/lib/timezone";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthCard, FormError } from "./AuthShell";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setPending(true);

    // Timezone + week_start (weekday of signup, in the user's own zone) ride along as signup
    // metadata; the on_auth_user_created trigger copies them onto profiles.
    const timezone = getBrowserTimeZone();
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim(), timezone, week_start: weekdayInTimeZone(timezone) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/today`,
      },
    });
    setPending(false);

    if (error) return setError(error.message);
    if (data.session) {
      router.replace("/today");
      router.refresh();
    } else {
      setCheckEmail(true); // project requires email confirmation
    }
  }

  if (checkEmail) {
    return (
      <AuthCard title="Check your email" subtitle={`We sent a confirmation link to ${email.trim()}.`}>
        <p className="text-center text-[14px] text-[var(--text-secondary)]">
          Open it to finish creating your account, then sign in.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle="Name, email, password. That's it.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Name" name="name" autoComplete="given-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
        <TextField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
        <TextField label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending || !name.trim() || !email.trim() || !password} className="mt-2 w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
