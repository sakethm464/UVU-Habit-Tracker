"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

/**
 * localStorage is the source of truth on a device (it applies before sign-in and before paint).
 * On a device that has never stored a choice, adopt the one saved on the profile so the manual
 * override follows the user across devices.
 */
export function ThemeSync({ profileTheme }: { profileTheme: ThemePreference }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    try {
      if (window.localStorage.getItem(THEME_STORAGE_KEY) === null && profileTheme !== "system") setTheme(profileTheme);
    } catch {
      /* storage unavailable */
    }
  }, [profileTheme, setTheme]);
  return null;
}
