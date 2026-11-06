"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ThemeToggle } from "./ThemeToggle";
import { TimezonePicker } from "./TimezonePicker";
import { createClient } from "@/lib/supabase/client";
import { disablePush, enablePush, permissionState } from "@/lib/beams";
import { needsIOSInstall } from "@/lib/platform";
import { getBrowserTimeZone, isValidTimeZone } from "@/lib/timezone";
import type { ThemePreference } from "@/lib/theme";
import type { Profile } from "@/lib/types";


function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex items-start justify-between gap-8 border-b border-[var(--border-subtle)] py-6 last:border-b-0">
      <div className="max-w-[320px]">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{description}</p>}
      </div>
      <div className="flex flex-col items-end gap-2">{children}</div>
    </section>
  );
}

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={"relative h-7 w-12 rounded-full border transition-colors disabled:opacity-60 " + (checked ? "bg-gold border-[var(--gold-from)]" : "border-[var(--border)] bg-[var(--surface-raised)]")}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-[left]"
        style={{ left: checked ? 24 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
      />
    </button>
  );
}

function PushHelp({ kind }: { kind: "ios" | "denied" }) {
  const box = "max-w-[340px] rounded-[12px] border border-[var(--gold-border)] bg-[var(--gold-soft)] px-4 py-3 text-left text-[12px] leading-relaxed text-[var(--text-secondary)]";
  if (kind === "ios") {
    return (
      <div className={box} role="note">
        <strong className="text-[var(--text)]">Install UVU to get notifications on iPhone/iPad.</strong>
        <ol className="mt-1 list-decimal pl-4">
          <li>Open this site in Safari and tap the Share button.</li>
          <li>Choose &ldquo;Add to Home Screen&rdquo;, then Add.</li>
          <li>Open UVU from your Home Screen and turn notifications on here. Requires iOS 16.4 or later.</li>
        </ol>
      </div>
    );
  }
  return (
    <div className={box} role="note">
      <strong className="text-[var(--text)]">Notifications are blocked for this site.</strong>
      <ul className="mt-1 list-disc pl-4">
        <li>Click the lock icon in the address bar, set Notifications to Allow, then reload and turn this on.</li>
        <li>Still blocked? Check your OS: Windows Settings &rarr; System &rarr; Notifications, or macOS System Settings &rarr; Notifications &rarr; your browser.</li>
      </ul>
    </div>
  );
}

export function SettingsView({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pushOn, setPushOn] = useState(profile.push_enabled);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [env, setEnv] = useState<{ denied: boolean; ios: boolean }>({ denied: false, ios: false });
  const [tz, setTz] = useState(profile.timezone);
  const [tzNote, setTzNote] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Browser-only facts; read after mount so the server render and first client render match.
  useEffect(() => {
    const id = setTimeout(() => setEnv({ denied: permissionState() === "denied", ios: needsIOSInstall() }), 0);
    return () => clearTimeout(id);
  }, []);

  const patchProfile = (patch: Partial<Profile>) => supabase.from("profiles").update(patch).eq("user_id", profile.user_id);

  async function onTheme(t: ThemePreference) {
    await patchProfile({ theme: t }); // localStorage (ThemeProvider) is already updated; this mirrors it. Non-fatal.
  }

  async function onTogglePush(next: boolean) {
    setPushNote(null);
    if (next && needsIOSInstall()) {
      setEnv((e) => ({ ...e, ios: true }));
      return;
    }
    setPushBusy(true);
    if (next) {
      const res = await enablePush(profile.user_id);
      if (res.ok) {
        const { error } = await patchProfile({ push_enabled: true });
        if (error) {
          await disablePush();
          setPushNote("Couldn't save your notification setting. Try again.");
        } else {
          setPushOn(true);
        }
      } else {
        await patchProfile({ push_enabled: false });
        setPushOn(false);
        setEnv((e) => ({ ...e, denied: permissionState() === "denied" }));
        if (res.reason === "unsupported") setPushNote("This browser doesn't support push notifications.");
        else if (res.reason === "not-configured") setPushNote("Push isn't configured yet (missing NEXT_PUBLIC_BEAMS_INSTANCE_ID).");
        else if (res.reason === "error") setPushNote(res.message ?? "Couldn't enable notifications. Try again.");
      }
    } else {
      await disablePush();
      const { error } = await patchProfile({ push_enabled: false });
      if (error) setPushNote("Couldn't save your notification setting. Try again.");
      else setPushOn(false);
    }
    setPushBusy(false);
  }

  async function onTimezone(next: string) {
    if (!isValidTimeZone(next)) return;
    const prev = tz;
    setTz(next);
    const { error } = await patchProfile({ timezone: next });
    if (error) {
      setTz(prev);
      setTzNote("Couldn't save timezone.");
      return;
    }
    setTzNote("Saved.");
    router.refresh(); // server components recompute "today" from the new zone
  }

  function closeDelete() {
    if (deleting) return;
    setConfirmDelete(false);
    setUnderstood(false);
    setDeleteError(null);
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      setDeleteError((await res.json().catch(() => null))?.error ?? "Couldn't delete your account.");
      return;
    }
    await disablePush();
    await supabase.auth.signOut();
    router.replace("/welcome");
    router.refresh();
  }

  const detected = typeof window !== "undefined" ? getBrowserTimeZone() : tz;
  const showDeniedHelp = env.denied && !env.ios;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <div>
        <h1 className="text-[30px] font-bold tracking-[-0.6px]">Settings</h1>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{email}</p>
      </div>

      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] px-8" style={{ boxShadow: "var(--shadow-card)" }}>
        <Section title="Notifications" description="Milestones and gentle heads-up when a streak breaks.">
          <Switch checked={pushOn && !env.denied} onChange={onTogglePush} label="Push notifications" disabled={pushBusy} />
          {env.ios && <PushHelp kind="ios" />}
          {showDeniedHelp && <PushHelp kind="denied" />}
          {pushNote && <p className="max-w-[320px] text-right text-[12px] text-[var(--text-secondary)]">{pushNote}</p>}
        </Section>

        <Section title="Appearance" description="Follows your system by default. Applies everywhere, including sign-in.">
          <ThemeToggle onChange={onTheme} />
        </Section>

        <Section title="Timezone" description="Decides when your day ends. Auto-detected; change it if you travel.">
          <TimezonePicker value={tz} onChange={onTimezone} />
          {detected !== tz && (
            <button type="button" onClick={() => onTimezone(detected)} className="text-[12px] text-[var(--gold-text)] hover:underline">
              Use detected ({detected.replace(/_/g, " ")})
            </button>
          )}
          {tzNote && (
            <span role="status" className="text-[12px] text-[var(--text-secondary)]">
              {tzNote}
            </span>
          )}
        </Section>

        <Section title="Delete account" description="Permanently deletes your account, habits and history. This can't be undone.">
          <Button variant="secondary" onClick={() => setConfirmDelete(true)} className="!border-[var(--habit-coral)]/50 !text-[var(--habit-coral)]">
            Delete account
          </Button>
        </Section>
      </div>

      <Modal open={confirmDelete} onClose={closeDelete} title="Delete account">
        <h2 className="mb-2 text-[22px] font-bold">Delete your account?</h2>
        <p className="mb-3 text-[14px] text-[var(--text-secondary)]">Here&apos;s exactly what happens when you delete your account:</p>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-[14px] text-[var(--text-secondary)]">
          <li>Your account and sign-in ({email}) are permanently removed.</li>
          <li>All of your habits and your full completion history are erased.</li>
          <li>Your streaks and notification settings are erased, and this device stops getting notifications.</li>
          <li>This happens immediately and can&apos;t be undone or recovered, not even by us.</li>
        </ul>
        <p className="mb-4 text-[13px] text-[var(--text-muted)]">
          You&apos;re always welcome to come back later and start fresh with a new account.
        </p>
        <label htmlFor="delete-confirm" className="mb-5 flex cursor-pointer items-start gap-3 text-[14px]">
          <input
            id="delete-confirm"
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            disabled={deleting}
            className="mt-[3px] h-4 w-4 flex-none cursor-pointer accent-[var(--habit-coral)]"
          />
          <span>I understand that my account and all of my data will be permanently deleted.</span>
        </label>
        {deleteError && (
          <p role="alert" className="mb-4 rounded-[12px] border border-[var(--habit-coral)]/40 bg-[var(--habit-coral)]/10 px-4 py-3 text-[13px] text-[var(--habit-coral)]">
            {deleteError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={deleting} onClick={closeDelete}>
            Cancel
          </Button>
          <Button disabled={deleting || !understood} onClick={deleteAccount} className="!bg-none !bg-[var(--habit-coral)] !text-white">
            {deleting ? "Deleting…" : "Delete forever"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
