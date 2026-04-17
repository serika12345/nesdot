interface PwaRuntimeMediaQueryListLike {
  readonly matches: boolean;
}

interface PwaRuntimeWindowLike {
  readonly matchMedia?: (query: string) => PwaRuntimeMediaQueryListLike;
}

interface PwaRuntimeNavigatorLike {
  readonly standalone?: boolean;
}

const matchesDisplayMode = (
  windowLike: PwaRuntimeWindowLike,
  query: string,
): boolean => {
  if (typeof windowLike.matchMedia !== "function") {
    return false;
  }

  return windowLike.matchMedia(query).matches === true;
};

export const isStandalonePwaRuntime = (
  windowLike: PwaRuntimeWindowLike,
  navigatorLike: PwaRuntimeNavigatorLike,
): boolean => {
  if (matchesDisplayMode(windowLike, "(display-mode: standalone)") === true) {
    return true;
  }

  if (
    matchesDisplayMode(
      windowLike,
      "(display-mode: window-controls-overlay)",
    ) === true
  ) {
    return true;
  }

  return navigatorLike.standalone === true;
};

export const resolveIsStandalonePwaRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  const standaloneValue: unknown = Reflect.get(navigator, "standalone");

  return isStandalonePwaRuntime(window, {
    standalone: standaloneValue === true,
  });
};
