import type { DownloadEvent } from "@tauri-apps/plugin-updater";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useEffect, useMemo, useState } from "react";

const hasTauriRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return Reflect.has(window, "__TAURI_INTERNALS__");
};

export interface DownloadProgressTracker {
  readonly downloadedBytes: number;
  readonly totalBytes: O.Option<number>;
}

export type DesktopAutoUpdateDialogState =
  | {
      readonly kind: "hidden";
    }
  | {
      readonly kind: "downloading";
      readonly version: string;
    }
  | {
      readonly kind: "ready";
      readonly version: string;
    }
  | {
      readonly kind: "failed";
      readonly message: string;
    };

export interface DesktopAutoUpdateController {
  readonly dialogState: DesktopAutoUpdateDialogState;
  readonly progressPercent: O.Option<number>;
  readonly onDialogClose: () => void;
  readonly onRestartNow: () => void;
}

interface DesktopAutoUpdateDialogPreviewState {
  readonly dialogState: DesktopAutoUpdateDialogState;
  readonly downloadProgressTracker: DownloadProgressTracker;
}

const DIALOG_PREVIEW_STATE_QUERY_KEY = "__debug-update-dialog-state";
const DIALOG_PREVIEW_VERSION_QUERY_KEY = "__debug-update-dialog-version";
const DIALOG_PREVIEW_PROGRESS_QUERY_KEY = "__debug-update-dialog-progress";
const DIALOG_PREVIEW_ERROR_QUERY_KEY = "__debug-update-dialog-error";

const createHiddenDialogState = (): DesktopAutoUpdateDialogState => {
  return {
    kind: "hidden",
  };
};

export const createInitialDownloadProgressTracker =
  (): DownloadProgressTracker => {
    return {
      downloadedBytes: 0,
      totalBytes: O.none,
    };
  };

const resolvePositiveNumber = (value: unknown): O.Option<number> => {
  if (typeof value !== "number") {
    return O.none;
  }

  const isFiniteNumber = Number.isFinite(value);
  const isPositive = value > 0;

  if (isFiniteNumber !== true || isPositive !== true) {
    return O.none;
  }

  return O.some(value);
};

const clampPercent = (value: number): number => {
  const rounded = Math.round(value);

  if (rounded < 0) {
    return 0;
  }

  if (rounded > 100) {
    return 100;
  }

  return rounded;
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

const resolvePreviewVersion = (queryParams: URLSearchParams): string => {
  return pipe(
    resolveNonEmptyQueryValue(queryParams, DIALOG_PREVIEW_VERSION_QUERY_KEY),
    O.getOrElse(() => "0.0.0"),
  );
};

const resolvePreviewProgressTracker = (
  queryParams: URLSearchParams,
): DownloadProgressTracker => {
  return pipe(
    resolveNonEmptyQueryValue(queryParams, DIALOG_PREVIEW_PROGRESS_QUERY_KEY),
    O.chain((value) => {
      const parsed = Number.parseFloat(value);
      const isFiniteNumber = Number.isFinite(parsed);

      if (isFiniteNumber !== true) {
        return O.none;
      }

      return O.some(clampPercent(parsed));
    }),
    O.match(
      () => createInitialDownloadProgressTracker(),
      (percent) => ({
        downloadedBytes: percent,
        totalBytes: O.some(100),
      }),
    ),
  );
};

const resolveDialogPreviewState =
  (): O.Option<DesktopAutoUpdateDialogPreviewState> => {
    if (typeof window === "undefined") {
      return O.none;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const previewState = resolveNonEmptyQueryValue(
      queryParams,
      DIALOG_PREVIEW_STATE_QUERY_KEY,
    );

    if (O.isNone(previewState)) {
      return O.none;
    }

    if (previewState.value === "downloading") {
      return O.some({
        dialogState: {
          kind: "downloading",
          version: resolvePreviewVersion(queryParams),
        },
        downloadProgressTracker: resolvePreviewProgressTracker(queryParams),
      });
    }

    if (previewState.value === "ready") {
      return O.some({
        dialogState: {
          kind: "ready",
          version: resolvePreviewVersion(queryParams),
        },
        downloadProgressTracker: createInitialDownloadProgressTracker(),
      });
    }

    if (previewState.value === "failed") {
      return O.some({
        dialogState: {
          kind: "failed",
          message: pipe(
            resolveNonEmptyQueryValue(
              queryParams,
              DIALOG_PREVIEW_ERROR_QUERY_KEY,
            ),
            O.getOrElse(() => "更新処理に失敗しました。"),
          ),
        },
        downloadProgressTracker: createInitialDownloadProgressTracker(),
      });
    }

    return O.none;
  };

export const applyDownloadEvent = (
  tracker: DownloadProgressTracker,
  event: DownloadEvent,
): DownloadProgressTracker => {
  if (event.event === "Started") {
    return {
      downloadedBytes: 0,
      totalBytes: resolvePositiveNumber(event.data.contentLength),
    };
  }

  if (event.event === "Progress") {
    return pipe(
      resolvePositiveNumber(event.data.chunkLength),
      O.match(
        () => tracker,
        (chunkLength) => ({
          downloadedBytes: tracker.downloadedBytes + chunkLength,
          totalBytes: tracker.totalBytes,
        }),
      ),
    );
  }

  return pipe(
    tracker.totalBytes,
    O.match(
      () => tracker,
      (totalBytes) => ({
        downloadedBytes: totalBytes,
        totalBytes: O.some(totalBytes),
      }),
    ),
  );
};

export const resolveDownloadProgressPercent = (
  tracker: DownloadProgressTracker,
): O.Option<number> => {
  return pipe(
    tracker.totalBytes,
    O.filter((totalBytes) => totalBytes > 0),
    O.map((totalBytes) =>
      clampPercent((tracker.downloadedBytes / totalBytes) * 100),
    ),
  );
};

const resolveUpdateNotes = (updateBody: unknown): string => {
  if (typeof updateBody !== "string") {
    return "";
  }

  const trimmedNotes = updateBody.trim();

  if (trimmedNotes.length === 0) {
    return "";
  }

  return `\n\nリリースノート:\n${trimmedNotes}`;
};

const buildUpdatePromptMessage = (
  version: string,
  updateBody: unknown,
): string => {
  const notes = resolveUpdateNotes(updateBody);
  return `新しいバージョン ${version} が利用できます。今すぐ更新を適用しますか？${notes}`;
};

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
};
export const useDesktopAutoUpdate = (): DesktopAutoUpdateController => {
  const [dialogState, setDialogState] = useState<DesktopAutoUpdateDialogState>(
    createHiddenDialogState(),
  );
  const [downloadProgressTracker, setDownloadProgressTracker] =
    useState<DownloadProgressTracker>(createInitialDownloadProgressTracker());

  const onDialogClose = useCallback((): void => {
    setDialogState(createHiddenDialogState());
  }, []);

  const onRestartNow = useCallback((): void => {
    const run = async (): Promise<void> => {
      try {
        const processModule = await import("@tauri-apps/plugin-process");
        await processModule.relaunch();
      } catch (error: unknown) {
        const message = resolveErrorMessage(error);
        console.error(`[updater] failed to relaunch: ${message}`);
        setDialogState({
          kind: "failed",
          message,
        });
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const run = async (): Promise<void> => {
      try {
        if (import.meta.env.DEV === true) {
          const dialogPreviewState = resolveDialogPreviewState();

          if (O.isSome(dialogPreviewState)) {
            setDownloadProgressTracker(
              dialogPreviewState.value.downloadProgressTracker,
            );
            setDialogState(dialogPreviewState.value.dialogState);
          }

          return;
        }

        if (hasTauriRuntime() !== true) {
          return;
        }

        const updaterModule = await import("@tauri-apps/plugin-updater");
        const update = await updaterModule.check();

        if (update instanceof Object !== true) {
          return;
        }

        const shouldInstall = window.confirm(
          buildUpdatePromptMessage(update.version, update.body),
        );

        if (shouldInstall !== true) {
          return;
        }

        setDownloadProgressTracker(createInitialDownloadProgressTracker());
        setDialogState({
          kind: "downloading",
          version: update.version,
        });

        try {
          await update.downloadAndInstall((event) => {
            setDownloadProgressTracker((currentTracker) =>
              applyDownloadEvent(currentTracker, event),
            );
          });
        } catch (error: unknown) {
          const message = resolveErrorMessage(error);
          console.error(`[updater] failed to apply update: ${message}`);
          setDialogState({
            kind: "failed",
            message,
          });
          return;
        }

        setDialogState({
          kind: "ready",
          version: update.version,
        });
      } catch (error: unknown) {
        console.info(
          `[updater] auto-update check skipped: ${resolveErrorMessage(error)}`,
        );
      }
    };

    void run();
  }, []);

  const progressPercent = useMemo((): O.Option<number> => {
    if (dialogState.kind !== "downloading") {
      return O.none;
    }

    return resolveDownloadProgressPercent(downloadProgressTracker);
  }, [dialogState.kind, downloadProgressTracker]);

  return {
    dialogState,
    progressPercent,
    onDialogClose,
    onRestartNow,
  };
};
