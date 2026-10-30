export type Theme = "day" | "night";

export const THEME_STORAGE_KEY = "theme";

// The saved choice, otherwise the device's dark mode setting
export function getPreferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "day" || saved === "night") return saved;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

// Same logic as getPreferredTheme, as an inline script for the root layout. It runs
// while the HTML is parsed, so the page is painted in the right theme straight away.
export const applyThemeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="day"&&t!=="night")t=matchMedia("(prefers-color-scheme: dark)").matches?"night":"day";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
