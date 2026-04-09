import { describe, expect, test, vi } from "vitest";

import {
  createPwaUpdateCheck,
  installPwaUpdateMonitor,
  resolvePwaUpdateDialogPreviewState,
} from "./pwaUpdateMonitor";

type VisibilityState = "hidden" | "visible" | "prerender";

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createMonitorEnvironment = () => {
  const focusListeners = new Map<"focus", () => void>();
  const visibilityListeners = new Map<"visibilitychange", () => void>();
  const intervalCallbacks = new Map<number, () => void>();
  const intervalDelay = {
    value: 0,
  };
  const documentState: { visibilityState: VisibilityState } = {
    visibilityState: "hidden",
  };
  const update = vi.fn(async () => {});
  const setIntervalSpy = vi.fn((handler: () => void, timeout: number) => {
    intervalDelay.value = timeout;
    intervalCallbacks.set(1, handler);
    return 1;
  });
  const clearIntervalSpy = vi.fn((intervalId: number) => {
    intervalCallbacks.delete(intervalId);
  });

  return {
    clearIntervalSpy,
    documentState,
    focusListeners,
    intervalCallbacks,
    intervalDelay,
    setIntervalSpy,
    update,
    visibilityListeners,
    environment: {
      document: {
        get visibilityState() {
          return documentState.visibilityState;
        },
        addEventListener: (
          eventName: "visibilitychange",
          listener: () => void,
        ) => {
          visibilityListeners.set(eventName, listener);
        },
        removeEventListener: (
          eventName: "visibilitychange",
          listener: () => void,
        ) => {
          if (visibilityListeners.get(eventName) === listener) {
            visibilityListeners.delete(eventName);
          }
        },
      },
      serviceWorker: {
        ready: Promise.resolve({
          update,
        }),
      },
      window: {
        addEventListener: (eventName: "focus", listener: () => void) => {
          focusListeners.set(eventName, listener);
        },
        clearInterval: clearIntervalSpy,
        removeEventListener: (eventName: "focus", listener: () => void) => {
          if (focusListeners.get(eventName) === listener) {
            focusListeners.delete(eventName);
          }
        },
        setInterval: setIntervalSpy,
      },
    },
  };
};

describe("installPwaUpdateMonitor", () => {
  test("checks immediately and when the app regains focus or becomes visible", async () => {
    const monitor = createMonitorEnvironment();
    const cleanup = installPwaUpdateMonitor(monitor.environment, 1_000);

    await flushMicrotasks();
    expect(monitor.update).toHaveBeenCalledTimes(1);

    const focusListener = monitor.focusListeners.get("focus");
    expect(typeof focusListener).toBe("function");
    if (typeof focusListener === "function") {
      focusListener();
    }

    await flushMicrotasks();
    expect(monitor.update).toHaveBeenCalledTimes(2);

    monitor.documentState.visibilityState = "visible";

    const visibilityListener =
      monitor.visibilityListeners.get("visibilitychange");
    expect(typeof visibilityListener).toBe("function");
    if (typeof visibilityListener === "function") {
      visibilityListener();
    }

    await flushMicrotasks();
    expect(monitor.update).toHaveBeenCalledTimes(3);

    cleanup();
  });

  test("uses the interval fallback, ignores hidden visibility changes, and cleans up listeners", async () => {
    const monitor = createMonitorEnvironment();
    const cleanup = installPwaUpdateMonitor(monitor.environment, 4_321);

    await flushMicrotasks();
    monitor.update.mockClear();

    const visibilityListener =
      monitor.visibilityListeners.get("visibilitychange");
    expect(typeof visibilityListener).toBe("function");
    if (typeof visibilityListener === "function") {
      visibilityListener();
    }

    await flushMicrotasks();
    expect(monitor.update).not.toHaveBeenCalled();

    const intervalCallback = monitor.intervalCallbacks.get(1);
    expect(monitor.setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      4_321,
    );
    expect(monitor.intervalDelay.value).toBe(4_321);
    expect(typeof intervalCallback).toBe("function");
    if (typeof intervalCallback === "function") {
      intervalCallback();
    }

    await flushMicrotasks();
    expect(monitor.update).toHaveBeenCalledTimes(1);

    cleanup();

    expect(monitor.focusListeners.size).toBe(0);
    expect(monitor.visibilityListeners.size).toBe(0);
    expect(monitor.intervalCallbacks.size).toBe(0);
    expect(monitor.clearIntervalSpy).toHaveBeenCalledWith(1);
  });
});

describe("createPwaUpdateCheck", () => {
  test("reports failed update checks without throwing", async () => {
    const reportError = vi.fn();
    const requestUpdate = createPwaUpdateCheck(
      {
        ready: Promise.reject(new Error("offline")),
      },
      reportError,
    );

    requestUpdate();
    await flushMicrotasks();

    expect(reportError).toHaveBeenCalledWith(
      "[pwa] failed to check for updates: offline",
    );
  });
});

describe("resolvePwaUpdateDialogPreviewState", () => {
  test("returns the available state for preview queries", () => {
    const previewState = resolvePwaUpdateDialogPreviewState(
      new URLSearchParams("__debug-pwa-update-state=available"),
    );

    expect(previewState).toEqual({
      _tag: "Some",
      value: {
        kind: "available",
      },
    });
  });

  test("returns the applying state for preview queries", () => {
    const previewState = resolvePwaUpdateDialogPreviewState(
      new URLSearchParams("__debug-pwa-update-state=applying"),
    );

    expect(previewState).toEqual({
      _tag: "Some",
      value: {
        kind: "applying",
      },
    });
  });

  test("returns the failed state with an explicit message", () => {
    const previewState = resolvePwaUpdateDialogPreviewState(
      new URLSearchParams(
        "__debug-pwa-update-state=failed&__debug-pwa-update-error=%E6%9B%B4%E6%96%B0%E3%81%AE%E9%81%A9%E7%94%A8%E3%81%AB%E5%A4%B1%E6%95%97%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F",
      ),
    );

    expect(previewState).toEqual({
      _tag: "Some",
      value: {
        kind: "failed",
        message: "更新の適用に失敗しました",
      },
    });
  });
});
