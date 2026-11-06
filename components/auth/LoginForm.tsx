"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthCard, FormError } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "link" ? "That link is invalid or expired. Please try again." : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setPending(false);
      return setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
    }
    router.replace("/today");
    router.refresh();
  }

  return (
    <AuthCard title="Welcome back" subtitle="Pick up right where you left off.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          labelAction={
            <Link href="/forgot-password" className="text-[12px] text-[var(--gold-text)] no-underline hover:underline">
              Forgot?
            </Link>
          }
        />
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending || !email.trim() || !password} className="mt-2 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
