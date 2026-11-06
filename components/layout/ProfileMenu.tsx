"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { disablePush } from "@/lib/beams";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Bottom-left sidebar profile card. Opens a 24px-radius modal whose only action is Log out. */
export function ProfileMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logOut() {
    setBusy(true);
    setError(null);
    await disablePush(); // detach this device so the next user here doesn't get this user's pushes
    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      setBusy(false);
      setError("Couldn't log out. Try again.");
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Profile"
        aria-haspopup="dialog"
        className="flex w-full items-center gap-[10px] rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-[10px] text-left transition-colors hover:border-[var(--gold-border)]"
      >
        <span
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--habit-coral), var(--habit-pink))" }}
        >
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">{name}</span>
          <span className="block truncate text-[11px] text-[var(--text-muted)]">{email}</span>
        </span>
      </button>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Profile">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full text-[16px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--habit-coral), var(--habit-pink))" }}
          >
            {initials(name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold">{name}</div>
            <div className="truncate text-[13px] text-[var(--text-muted)]">{email}</div>
          </div>
        </div>
        {error && (
          <p role="alert" className="mb-4 text-[13px] text-[var(--habit-coral)]">
            {error}
          </p>
        )}
        <Button variant="secondary" onClick={logOut} disabled={busy} className="w-full">
          {busy ? "Logging out…" : "Log out"}
        </Button>
      </Modal>
    </>
  );
}
