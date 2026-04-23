import React from "react";
import { z } from "zod";

const THEME_PREFERENCE_STORAGE_KEY = "nesdot-theme-preference";
const prefersDarkColorSchemeQuery = "(prefers-color-scheme: dark)";

const themePreferenceSchema = z.enum(["light", "dark", "system"]);

interface ThemePreferenceStorageLike {
  readonly getItem?: (key: string) => string | null;
  readonly setItem?: (key: string, value: string) => void;
}

interface ThemePreferenceMediaQueryListLike {
  readonly matches: boolean;
  readonly addEventListener?: (type: "change", listener: () => void) => void;
  readonly removeEventListener?: (type: "change", listener: () => void) => void;
  readonly addListener?: (listener: () => void) => void;
  readonly removeListener?: (listener: () => void) => void;
}

interface ThemePreferenceWindowLike {
  readonly addEventListener?: (
    type: "storage",
    listener: (event: StorageEvent) => void,
  ) => void;
  readonly localStorage?: ThemePreferenceStorageLike;
  readonly matchMedia?: (query: string) => ThemePreferenceMediaQueryListLike;
  readonly removeEventListener?: (
    type: "storage",
    listener: (event: StorageEvent) => void,
  ) => void;
}

export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type ThemeAppearance = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

const parseThemePreference = (value: unknown): ThemePreference => {
  const result = themePreferenceSchema.safeParse(value);

  return result.success === true ? result.data : DEFAULT_THEME_PREFERENCE;
};

export const readStoredThemePreference = (
  storage: ThemePreferenceStorageLike,
): ThemePreference => {
  if (typeof storage?.getItem !== "function") {
    return DEFAULT_THEME_PREFERENCE;
  }

  return parseThemePreference(storage.getItem(THEME_PREFERENCE_STORAGE_KEY));
};

export const writeStoredThemePreference = (
  storage: ThemePreferenceStorageLike,
  themePreference: ThemePreference,
): void => {
  if (typeof storage?.setItem !== "function") {
    return;
  }

  storage.setItem(THEME_PREFERENCE_STORAGE_KEY, themePreference);
};

export const resolveSystemThemeAppearance = (
  windowLike: ThemePreferenceWindowLike,
): ThemeAppearance => {
  if (typeof windowLike.matchMedia !== "function") {
    return "light";
  }

  return windowLike.matchMedia(prefersDarkColorSchemeQuery).matches === true
    ? "dark"
    : "light";
};

export const resolveThemeAppearance = (
  themePreference: ThemePreference,
  systemThemeAppearance: ThemeAppearance,
): ThemeAppearance => {
  if (themePreference === "system") {
    return systemThemeAppearance;
  }

  return themePreference;
};

const subscribeToSystemThemeChanges = (
  mediaQueryList: ThemePreferenceMediaQueryListLike,
  listener: () => void,
): (() => void) => {
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);

    return () => {
      if (typeof mediaQueryList.removeEventListener === "function") {
        mediaQueryList.removeEventListener("change", listener);
      }
    };
  }

  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);

    return () => {
      if (typeof mediaQueryList.removeListener === "function") {
        mediaQueryList.removeListener(listener);
      }
    };
  }

  return () => {
    return;
  };
};

const resolveBrowserWindow = (): ThemePreferenceWindowLike => {
  if (typeof window === "undefined") {
    return {};
  }

  return window;
};

export const useThemePreference = (): Readonly<{
  resolvedThemeAppearance: ThemeAppearance;
  setThemePreference: (nextThemePreference: ThemePreference) => void;
  themePreference: ThemePreference;
}> => {
  const browserWindow = resolveBrowserWindow();
  const [themePreference, setThemePreference] = React.useState<ThemePreference>(
    () => readStoredThemePreference(browserWindow.localStorage ?? {}),
  );
  const [systemThemeAppearance, setSystemThemeAppearance] =
    React.useState<ThemeAppearance>(() =>
      resolveSystemThemeAppearance(browserWindow),
    );

  React.useEffect(() => {
    const nextBrowserWindow = resolveBrowserWindow();

    if (typeof nextBrowserWindow.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = nextBrowserWindow.matchMedia(
      prefersDarkColorSchemeQuery,
    );
    const handleChange = (): void => {
      setSystemThemeAppearance(
        mediaQueryList.matches === true ? "dark" : "light",
      );
    };

    handleChange();

    return subscribeToSystemThemeChanges(mediaQueryList, handleChange);
  }, []);

  React.useEffect(() => {
    writeStoredThemePreference(
      resolveBrowserWindow().localStorage ?? {},
      themePreference,
    );
  }, [themePreference]);

  React.useEffect(() => {
    const nextBrowserWindow = resolveBrowserWindow();

    if (
      typeof nextBrowserWindow.addEventListener !== "function" ||
      typeof nextBrowserWindow.removeEventListener !== "function"
    ) {
      return;
    }

    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== THEME_PREFERENCE_STORAGE_KEY) {
        return;
      }

      setThemePreference(
        readStoredThemePreference(nextBrowserWindow.localStorage ?? {}),
      );
    };
    const removeStorageEventListener = nextBrowserWindow.removeEventListener;

    nextBrowserWindow.addEventListener("storage", handleStorage);

    return () => {
      removeStorageEventListener("storage", handleStorage);
    };
  }, []);

  const resolvedThemeAppearance = React.useMemo(
    () => resolveThemeAppearance(themePreference, systemThemeAppearance),
    [systemThemeAppearance, themePreference],
  );

  return {
    resolvedThemeAppearance,
    setThemePreference,
    themePreference,
  };
};
