import { afterEach, describe, expect, test, vi } from "vitest";
import { applyThemeScript, getPreferredTheme, THEME_STORAGE_KEY } from "./theme";

function prefersDark(dark: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({ matches: dark } as MediaQueryList);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("data-theme");
});

describe("getPreferredTheme", () => {
  test("uses the saved choice", () => {
    prefersDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, "day");
    expect(getPreferredTheme()).toBe("day");
  });

  test("falls back to the device setting", () => {
    prefersDark(true);
    expect(getPreferredTheme()).toBe("night");
    prefersDark(false);
    expect(getPreferredTheme()).toBe("day");
  });

  test("ignores a saved value that isn't a theme", () => {
    prefersDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    expect(getPreferredTheme()).toBe("night");
  });
});

describe("applyThemeScript", () => {
  test("sets the same theme as getPreferredTheme", () => {
    for (const [saved, dark] of [["night", false], ["day", true], [null, true], [null, false]] as const) {
      prefersDark(dark);
      if (saved) localStorage.setItem(THEME_STORAGE_KEY, saved);
      else localStorage.removeItem(THEME_STORAGE_KEY);
      new Function(applyThemeScript)();
      expect(document.documentElement.getAttribute("data-theme")).toBe(getPreferredTheme());
    }
  });
});
