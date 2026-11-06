// Browser/platform sniffing for push. Client-only (call from effects/handlers, not during render).

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as a Mac but has a touch screen.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** True when launched from the home screen (installed PWA). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/** iOS only delivers web push to PWAs added to the Home Screen (iOS 16.4+). */
export function needsIOSInstall(): boolean {
  return isIOS() && !isStandalone();
}
