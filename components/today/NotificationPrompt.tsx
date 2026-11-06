"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { enablePush, permissionState, pushSupported } from "@/lib/beams";

const KEY = "uvu-push-prompted"; // first-run prompt answered on this device
const DEVICE_KEY = "uvu-push-device-prompted"; // "turn on for this device" banner dismissed on this device

type Mode = "first-run" | "this-device" | null;

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false; // storage blocked: fall back to showing once per page load
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Notification prompts on Today.
 *
 * - Account has notifications OFF, browser undecided: one-time "Want a nudge?" prompt.
 * - Account has notifications ON (e.g. turned on from a laptop) but this device isn't set up:
 *     - permission already granted: quietly register this device, no UI.
 *     - permission undecided: show a one-tap banner (browsers require a tap to show the permission pop-up).
 *     - permission blocked / unsupported: nothing here (Settings explains how to fix it).
 */
export function NotificationPrompt({ userId, pushEnabled }: { userId: string; pushEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Defer so the first client render matches the server render.
    const id = setTimeout(() => {
      if (!pushSupported()) return setMode(null);
      const permission = permissionState();

      if (!pushEnabled) {
        setMode(!readFlag(KEY) && permission === "default" ? "first-run" : null);
        return;
      }
      if (permission === "granted") {
        void enablePush(userId); // already allowed here: attach this device to the account silently
        setMode(null);
      } else {
        setMode(permission === "default" && !readFlag(DEVICE_KEY) ? "this-device" : null);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [pushEnabled, userId]);

  async function enable() {
    setBusy(true);
    const res = await enablePush(userId);
    if (mode === "first-run") {
      await createClient().from("profiles").update({ push_enabled: res.ok }).eq("user_id", userId);
      writeFlag(KEY);
    } else if (!res.ok) {
      writeFlag(DEVICE_KEY); // they said no on this device; don't ask again. The account setting stays on for other devices.
    }
    setBusy(false);
    setMode(null);
  }

  function dismiss() {
    writeFlag(mode === "first-run" ? KEY : DEVICE_KEY);
    setMode(null);
  }

  if (!mode) return null;
  const thisDevice = mode === "this-device";
  return (
    <div role="region" aria-label="Notifications" className="flex items-center justify-between gap-6 rounded-[16px] border border-[var(--gold-border)] bg-[var(--gold-soft)] px-5 py-4">
      <div>
        <div className="text-[14px] font-semibold">{thisDevice ? "Turn on notifications for this device?" : "Want a nudge when it counts?"}</div>
        <div className="text-[13px] text-[var(--text-secondary)]">
          {thisDevice
            ? "Notifications are on for your account. Allow them here too so this device gets streak milestones and break alerts."
            : "We'll ping you for streak milestones and if a streak breaks. No spam."}
        </div>
      </div>
      <div className="flex flex-none gap-2">
        <Button variant="ghost" onClick={dismiss} disabled={busy}>
          Not now
        </Button>
        <Button onClick={enable} disabled={busy}>
          {busy ? "Enabling…" : "Turn on"}
        </Button>
      </div>
    </div>
  );
}
