import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import {
  createHiddenPwaUpdateDialogState,
  installPwaUpdateMonitor,
  resolvePwaUpdateDialogPreviewState,
  resolvePwaUpdateErrorMessage,
  type PwaUpdateDialogState,
} from "./pwaUpdateMonitor";

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

export interface PwaUpdateController {
  readonly dialogState: PwaUpdateDialogState;
  readonly onDialogClose: () => void;
  readonly onUpdateNow: () => void;
}

const APPLY_UPDATE_UNAVAILABLE_MESSAGE =
  "更新を開始できませんでした。ページを再読み込みしてもう一度お試しください。";

const hasTauriRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return Reflect.has(window, "__TAURI_INTERNALS__");
};

const canUsePwaUpdate = (): boolean => {
  return (
    import.meta.env.PROD &&
    hasTauriRuntime() !== true &&
    "window" in globalThis &&
    "document" in globalThis &&
    "navigator" in globalThis &&
    "serviceWorker" in navigator
  );
};

const resolveDialogPreviewState = (): O.Option<PwaUpdateDialogState> => {
  if (typeof window === "undefined") {
    return O.none;
  }

  return resolvePwaUpdateDialogPreviewState(
    new URLSearchParams(window.location.search),
  );
};

const runOptionalCleanup = (cleanup: O.Option<() => void>): void => {
  pipe(
    cleanup,
    O.match(
      () => {
        return;
      },
      (dispose) => {
        dispose();
      },
    ),
  );
};

export const usePwaUpdate = (): PwaUpdateController => {
  const [dialogState, setDialogState] = useState<PwaUpdateDialogState>(
    createHiddenPwaUpdateDialogState(),
  );
  const applyUpdateRef = useRef<O.Option<UpdateServiceWorker>>(O.none);
  const monitorCleanupRef = useRef<O.Option<() => void>>(O.none);

  const onDialogClose = useCallback((): void => {
    setDialogState(createHiddenPwaUpdateDialogState());
  }, []);

  const onUpdateNow = useCallback((): void => {
    pipe(
      applyUpdateRef.current,
      O.match(
        () => {
          setDialogState({
            kind: "failed",
            message: APPLY_UPDATE_UNAVAILABLE_MESSAGE,
          });
        },
        (applyUpdate) => {
          setDialogState({
            kind: "applying",
          });

          void applyUpdate(true).catch((error: unknown) => {
            setDialogState({
              kind: "failed",
              message: resolvePwaUpdateErrorMessage(error),
            });
          });
        },
      ),
    );
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV === true) {
      const previewState = resolveDialogPreviewState();

      if (O.isSome(previewState)) {
        applyUpdateRef.current = O.some(async () => {
          setDialogState({
            kind: "applying",
          });
        });
        setDialogState(previewState.value);
      }

      return () => {
        applyUpdateRef.current = O.none;
      };
    }

    if (canUsePwaUpdate() !== true) {
      return () => {
        return;
      };
    }

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        setDialogState({
          kind: "available",
        });
      },
      onRegisteredSW: (_swScriptUrl, registration) => {
        if (registration instanceof Object !== true) {
          return;
        }

        runOptionalCleanup(monitorCleanupRef.current);
        monitorCleanupRef.current = O.some(
          installPwaUpdateMonitor({
            document,
            serviceWorker: {
              ready: Promise.resolve(registration),
            },
            window,
          }),
        );
      },
      onRegisterError: (error) => {
        console.info(
          `[pwa] registration skipped: ${resolvePwaUpdateErrorMessage(error)}`,
        );
      },
    });

    applyUpdateRef.current = O.some(updateServiceWorker);

    return () => {
      applyUpdateRef.current = O.none;
      runOptionalCleanup(monitorCleanupRef.current);
      monitorCleanupRef.current = O.none;
    };
  }, []);

  return {
    dialogState,
    onDialogClose,
    onUpdateNow,
  };
};
