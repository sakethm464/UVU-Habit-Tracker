"use client";

// Pusher Beams (Web Push, Authenticated Users mode). Devices subscribe by user_id; the token
// comes from /api/beams/auth. Browser-only. Delivery happens server-side (Edge Function send-push).

import { Client, TokenProvider } from "@pusher/push-notifications-web";

export type PushResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "not-configured" | "error"; message?: string };

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  return pushSupported() ? Notification.permission : "unsupported";
}

async function getClient(): Promise<Client | null> {
  const instanceId = process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID;
  if (!instanceId) return null;
  // Must be the worker served from /service-worker.js (it importScripts Pusher's worker).
  const registration = await navigator.serviceWorker.register("/service-worker.js");
  await navigator.serviceWorker.ready;
  return new Client({ instanceId, serviceWorkerRegistration: registration });
}

/** Ask for permission (if needed) and register this device for `userId`. */
export async function enablePush(userId: string): Promise<PushResult> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  try {
    const client = await getClient();
    if (!client) return { ok: false, reason: "not-configured" };

    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") return { ok: false, reason: "denied" };

    await client.start();
    await client.setUserId(userId, new TokenProvider({ url: "/api/beams/auth", credentials: "include" }));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : undefined };
  }
}

const DISABLE_TIMEOUT_MS = 3000;

/**
 * Detach this device from the current user (toggle off / log out / delete account).
 * Never throws and never blocks longer than DISABLE_TIMEOUT_MS: the Beams client's stop() can
 * hang (e.g. a device that never subscribed), and that must not stall signing out.
 */
export async function disablePush(): Promise<void> {
  // Without granted permission this device cannot hold a push subscription: nothing to detach.
  if (!pushSupported() || !process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID || Notification.permission !== "granted") return;
  const detach = (async () => {
    const client = await getClient();
    await client?.stop();
    await client?.clearAllState();
  })().catch(() => {
    /* best effort */
  });
  await Promise.race([detach, new Promise<void>((resolve) => setTimeout(resolve, DISABLE_TIMEOUT_MS))]);
}
