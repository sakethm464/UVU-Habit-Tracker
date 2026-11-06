"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthCard, FormError } from "./AuthShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setPending(false);
      return setError(error.message);
    }
    router.replace("/today");
    router.refresh();
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending || !password} className="mt-2 w-full">
          {pending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
