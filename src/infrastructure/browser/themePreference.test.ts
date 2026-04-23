import { describe, expect, test } from "vitest";
import {
  DEFAULT_THEME_PREFERENCE,
  readStoredThemePreference,
  resolveSystemThemeAppearance,
  resolveThemeAppearance,
} from "./themePreference";

describe("themePreference", () => {
  test("falls back to the default preference when storage is unavailable", () => {
    expect(readStoredThemePreference({})).toBe(DEFAULT_THEME_PREFERENCE);
  });

  test("reads a valid persisted theme preference", () => {
    expect(
      readStoredThemePreference({
        getItem: () => "dark",
      }),
    ).toBe("dark");
  });

  test("rejects an invalid persisted theme preference", () => {
    expect(
      readStoredThemePreference({
        getItem: () => "sepia",
      }),
    ).toBe(DEFAULT_THEME_PREFERENCE);
  });

  test("resolves system preference from matchMedia", () => {
    expect(
      resolveSystemThemeAppearance({
        matchMedia: (query) => ({
          matches: query === "(prefers-color-scheme: dark)",
        }),
      }),
    ).toBe("dark");
  });

  test("defaults system theme resolution to light without matchMedia", () => {
    expect(resolveSystemThemeAppearance({})).toBe("light");
  });

  test("uses the resolved system appearance for the system preference", () => {
    expect(resolveThemeAppearance("system", "dark")).toBe("dark");
  });

  test("prefers the explicit light and dark selections over the system appearance", () => {
    expect(resolveThemeAppearance("light", "dark")).toBe("light");
    expect(resolveThemeAppearance("dark", "light")).toBe("dark");
  });
});
