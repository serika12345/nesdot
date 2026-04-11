import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";

interface PwaServiceWorkerRegistrationLike {
  readonly update: () => Promise<void>;
}

export type PwaUpdateDialogState =
  | {
      readonly kind: "hidden";
    }
  | {
      readonly kind: "available";
    }
  | {
      readonly kind: "applying";
    }
  | {
      readonly kind: "failed";
      readonly message: string;
    };

export interface PwaServiceWorkerLike {
  readonly ready: Promise<PwaServiceWorkerRegistrationLike>;
}

interface PwaWindowLike {
  readonly addEventListener: (type: "focus", listener: () => void) => void;
  readonly removeEventListener: (type: "focus", listener: () => void) => void;
  readonly setInterval: (handler: () => void, timeout: number) => number;
  readonly clearInterval: (intervalId: number) => void;
}

interface PwaDocumentLike {
  readonly visibilityState: "hidden" | "visible" | "prerender";
  readonly addEventListener: (
    type: "visibilitychange",
    listener: () => void,
  ) => void;
  readonly removeEventListener: (
    type: "visibilitychange",
    listener: () => void,
  ) => void;
}

interface PwaUpdateEnvironment {
  readonly document: PwaDocumentLike;
  readonly serviceWorker: PwaServiceWorkerLike;
  readonly window: PwaWindowLike;
}

const PWA_UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1_000;
const PWA_UPDATE_PREVIEW_STATE_QUERY_KEY = "__debug-pwa-update-state";
const PWA_UPDATE_PREVIEW_ERROR_QUERY_KEY = "__debug-pwa-update-error";
const DEFAULT_PWA_UPDATE_ERROR_MESSAGE = "更新の適用に失敗しました";

export const createHiddenPwaUpdateDialogState = (): PwaUpdateDialogState => {
  return {
    kind: "hidden",
  };
};

const resolveNonEmptyQueryValue = (
  queryParams: URLSearchParams,
  key: string,
): O.Option<string> => {
  return pipe(
    O.fromNullable(queryParams.get(key)),
    O.map((value) => value.trim()),
    O.filter((value) => value.length > 0),
  );
};

export const resolvePwaUpdateErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
};

export const resolvePwaUpdateDialogPreviewState = (
  queryParams: URLSearchParams,
): O.Option<PwaUpdateDialogState> => {
  const previewState = resolveNonEmptyQueryValue(
    queryParams,
    PWA_UPDATE_PREVIEW_STATE_QUERY_KEY,
  );

  if (O.isNone(previewState)) {
    return O.none;
  }

  if (previewState.value === "available") {
    return O.some({
      kind: "available",
    });
  }

  if (previewState.value === "applying") {
    return O.some({
      kind: "applying",
    });
  }

  if (previewState.value === "failed") {
    return O.some({
      kind: "failed",
      message: pipe(
        resolveNonEmptyQueryValue(
          queryParams,
          PWA_UPDATE_PREVIEW_ERROR_QUERY_KEY,
        ),
        O.getOrElse(() => DEFAULT_PWA_UPDATE_ERROR_MESSAGE),
      ),
    });
  }

  return O.none;
};

const reportPwaUpdateError = (message: string): void => {
  console.error(message);
};

export const createPwaUpdateCheck = (
  serviceWorker: PwaServiceWorkerLike,
  reportError: (message: string) => void = reportPwaUpdateError,
): (() => void) => {
  return () => {
    void serviceWorker.ready
      .then((registration) => registration.update())
      .catch((error: unknown) => {
        reportError(
          `[pwa] failed to check for updates: ${resolvePwaUpdateErrorMessage(error)}`,
        );
      });
  };
};

export const installPwaUpdateMonitor = (
  environment: PwaUpdateEnvironment,
  intervalMs: number = PWA_UPDATE_CHECK_INTERVAL_MS,
): (() => void) => {
  const checkForUpdates = createPwaUpdateCheck(environment.serviceWorker);
  const onWindowFocus = () => {
    checkForUpdates();
  };
  const onVisibilityChange = () => {
    if (environment.document.visibilityState === "visible") {
      checkForUpdates();
    }
  };

  environment.window.addEventListener("focus", onWindowFocus);
  environment.document.addEventListener("visibilitychange", onVisibilityChange);

  const intervalId = environment.window.setInterval(() => {
    checkForUpdates();
  }, intervalMs);

  checkForUpdates();

  return () => {
    environment.window.removeEventListener("focus", onWindowFocus);
    environment.document.removeEventListener(
      "visibilitychange",
      onVisibilityChange,
    );
    environment.window.clearInterval(intervalId);
  };
};
