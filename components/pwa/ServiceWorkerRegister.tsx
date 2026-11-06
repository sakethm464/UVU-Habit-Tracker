"use client";

import { useEffect } from "react";

/** Registers /service-worker.js (also the Pusher Beams worker). Production only, so dev HMR isn't cached. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      /* non-fatal: app works without it */
    });
  }, []);
  return null;
}
