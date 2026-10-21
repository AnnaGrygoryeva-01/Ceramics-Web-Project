"use client";

import { useLayoutEffect } from "react";
import { getPreferredTheme, THEME_STORAGE_KEY } from "@/lib/theme";

export default function ThemeToggle() {
  // In development React clears the attribute the inline script set when it remounts <html>,
  // so apply the theme again. Does nothing visible in production.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", getPreferredTheme());
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "night" ? "day" : "night";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }

  // Both icons are rendered and CSS shows the right one, so the server HTML
  // never disagrees with the theme the inline script picked
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Switch between day and night theme">
      <svg className="theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg className="theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
