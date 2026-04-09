import type { DownloadEvent } from "@tauri-apps/plugin-updater";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export type DesktopAutoUpdateFailureOperation =
  | "check"
  | "start"
  | "download-install"
  | "restart";

export type DesktopAutoUpdateDialogState =
  | {
      readonly kind: "hidden";
    }
  | {
      readonly kind: "checking";
    }
  | {
      readonly kind: "available";
      readonly version: string;
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
      readonly kind: "up-to-date";
    }
  | {
      readonly kind: "failed";
      readonly message: string;
      readonly detail: string;
      readonly operationLabel: string;
      readonly recoveryHint: string;
      readonly versionLabel: string;
    };

export interface DesktopAutoUpdateController {
  readonly dialogState: DesktopAutoUpdateDialogState;
  readonly progressPercent: O.Option<number>;
  readonly onCheckNow: () => void;
  readonly onDialogClose: () => void;
  readonly onUpdateNow: () => void;
  readonly onRestartNow: () => void;
}

interface DownloadableDesktopUpdate {
  readonly version: string;
  readonly downloadAndInstall: (
    onEvent?: (event: DownloadEvent) => void,
  ) => Promise<void>;
}

interface DesktopAutoUpdateDialogPreviewState {
  readonly dialogState: DesktopAutoUpdateDialogState;
  readonly downloadProgressTracker: DownloadProgressTracker;
}

interface CreateFailedDialogStateInput {
  readonly detail: string;
  readonly operation: DesktopAutoUpdateFailureOperation;
  readonly version: O.Option<string>;
}

const DIALOG_PREVIEW_STATE_QUERY_KEY = "__debug-update-dialog-state";
const DIALOG_PREVIEW_VERSION_QUERY_KEY = "__debug-update-dialog-version";
const DIALOG_PREVIEW_PROGRESS_QUERY_KEY = "__debug-update-dialog-progress";
const DIALOG_PREVIEW_ERROR_QUERY_KEY = "__debug-update-dialog-error";
const DIALOG_PREVIEW_OPERATION_QUERY_KEY = "__debug-update-dialog-operation";
const DESKTOP_AUTO_UPDATE_CHECK_REQUEST_EVENT_NAME =
  "desktop-auto-update://check-request";
const APPLY_UPDATE_UNAVAILABLE_MESSAGE =
  "更新を開始できませんでした。アプリを再起動してもう一度お試しください。";
const DESKTOP_UPDATE_CHECK_UNAVAILABLE_MESSAGE =
  "デスクトップ実行時のみ更新確認を利用できます。Tauri アプリとして起動してからお試しください。";
const UNKNOWN_VERSION_LABEL = "不明";

export const requestDesktopAutoUpdateCheck = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(DESKTOP_AUTO_UPDATE_CHECK_REQUEST_EVENT_NAME),
  );
};

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
    resolvePreviewVersionOption(queryParams),
    O.getOrElse(() => "0.0.0"),
  );
};

const resolvePreviewVersionOption = (
  queryParams: URLSearchParams,
): O.Option<string> => {
  return resolveNonEmptyQueryValue(
    queryParams,
    DIALOG_PREVIEW_VERSION_QUERY_KEY,
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

    if (previewState.value === "checking") {
      return O.some({
        dialogState: {
          kind: "checking",
        },
        downloadProgressTracker: createInitialDownloadProgressTracker(),
      });
    }

    if (previewState.value === "available") {
      return O.some({
        dialogState: {
          kind: "available",
          version: resolvePreviewVersion(queryParams),
        },
        downloadProgressTracker: createInitialDownloadProgressTracker(),
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

    if (previewState.value === "up-to-date") {
      return O.some({
        dialogState: {
          kind: "up-to-date",
        },
        downloadProgressTracker: createInitialDownloadProgressTracker(),
      });
    }

    if (previewState.value === "failed") {
      return O.some({
        dialogState: createFailedDialogState({
          detail: pipe(
            resolveNonEmptyQueryValue(
              queryParams,
              DIALOG_PREVIEW_ERROR_QUERY_KEY,
            ),
            O.getOrElse(() => "更新処理に失敗しました。"),
          ),
          operation: resolvePreviewFailureOperation(queryParams),
          version: resolvePreviewVersionOption(queryParams),
        }),
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

const resolveFailureOperationLabel = (
  operation: DesktopAutoUpdateFailureOperation,
): string => {
  if (operation === "check") {
    return "更新確認";
  }

  if (operation === "start") {
    return "更新開始";
  }

  if (operation === "restart") {
    return "再起動";
  }

  return "ダウンロード / インストール";
};

const resolveFailureMessage = (
  operation: DesktopAutoUpdateFailureOperation,
): string => {
  if (operation === "check") {
    return "更新確認で問題が発生しました。";
  }

  if (operation === "start") {
    return "更新を開始できませんでした。";
  }

  if (operation === "restart") {
    return "再起動処理で問題が発生しました。";
  }

  return "ダウンロードまたはインストール処理で問題が発生しました。";
};

const resolveFailureRecoveryHint = (
  operation: DesktopAutoUpdateFailureOperation,
): string => {
  if (operation === "check") {
    return "ネットワーク接続と更新チェック先を確認してから、もう一度更新確認を実行してください。";
  }

  if (operation === "start") {
    return "更新ダイアログを閉じてもう一度更新を確認してください。改善しない場合はアプリを再起動してください。";
  }

  if (operation === "restart") {
    return "更新は適用済みの可能性があります。アプリを手動で終了して再起動してください。";
  }

  return "ネットワーク接続、配布ファイル、署名を確認してから再度お試しください。";
};

const resolveVersionLabel = (version: O.Option<string>): string => {
  return pipe(
    version,
    O.getOrElse(() => UNKNOWN_VERSION_LABEL),
  );
};

const resolvePreviewFailureOperation = (
  queryParams: URLSearchParams,
): DesktopAutoUpdateFailureOperation => {
  return pipe(
    resolveNonEmptyQueryValue(queryParams, DIALOG_PREVIEW_OPERATION_QUERY_KEY),
    O.filter(
      (value): value is DesktopAutoUpdateFailureOperation =>
        value === "check" ||
        value === "start" ||
        value === "download-install" ||
        value === "restart",
    ),
    O.getOrElse<DesktopAutoUpdateFailureOperation>(() => "download-install"),
  );
};

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
};

export const createFailedDialogState = ({
  detail,
  operation,
  version,
}: CreateFailedDialogStateInput): DesktopAutoUpdateDialogState => {
  return {
    kind: "failed",
    detail,
    message: resolveFailureMessage(operation),
    operationLabel: resolveFailureOperationLabel(operation),
    recoveryHint: resolveFailureRecoveryHint(operation),
    versionLabel: resolveVersionLabel(version),
  };
};

export const useDesktopAutoUpdate = (): DesktopAutoUpdateController => {
  const [dialogState, setDialogState] = useState<DesktopAutoUpdateDialogState>(
    createHiddenDialogState(),
  );
  const [downloadProgressTracker, setDownloadProgressTracker] =
    useState<DownloadProgressTracker>(createInitialDownloadProgressTracker());
  const updateRef = useRef<O.Option<DownloadableDesktopUpdate>>(O.none);

  const onDialogClose = useCallback((): void => {
    setDialogState(createHiddenDialogState());
  }, []);

  const runCheck = useCallback((showNoUpdateDialog: boolean): void => {
    const run = async (): Promise<void> => {
      if (showNoUpdateDialog === true) {
        setDialogState({
          kind: "checking",
        });
      }

      setDownloadProgressTracker(createInitialDownloadProgressTracker());
      updateRef.current = O.none;

      if (hasTauriRuntime() !== true) {
        if (showNoUpdateDialog === true) {
          setDialogState(
            createFailedDialogState({
              detail: DESKTOP_UPDATE_CHECK_UNAVAILABLE_MESSAGE,
              operation: "check",
              version: O.none,
            }),
          );
        }

        return;
      }

      try {
        const updaterModule = await import("@tauri-apps/plugin-updater");
        const update = await updaterModule.check();

        pipe(
          O.fromNullable(update),
          O.match(
            () => {
              if (showNoUpdateDialog === true) {
                setDialogState({
                  kind: "up-to-date",
                });
              }
            },
            (availableUpdate) => {
              updateRef.current = O.some(availableUpdate);
              setDialogState({
                kind: "available",
                version: availableUpdate.version,
              });
            },
          ),
        );
      } catch (error: unknown) {
        const message = resolveErrorMessage(error);

        if (showNoUpdateDialog === true) {
          console.error(`[updater] failed to check for updates: ${message}`);
          setDialogState(
            createFailedDialogState({
              detail: message,
              operation: "check",
              version: O.none,
            }),
          );
          return;
        }

        console.info(`[updater] auto-update check skipped: ${message}`);
      }
    };

    void run();
  }, []);

  const onCheckNow = useCallback((): void => {
    runCheck(true);
  }, [runCheck]);

  const onUpdateNow = useCallback((): void => {
    pipe(
      updateRef.current,
      O.match(
        () => {
          setDialogState(
            createFailedDialogState({
              detail: APPLY_UPDATE_UNAVAILABLE_MESSAGE,
              operation: "start",
              version:
                dialogState.kind === "available"
                  ? O.some(dialogState.version)
                  : O.none,
            }),
          );
        },
        (update) => {
          setDownloadProgressTracker(createInitialDownloadProgressTracker());
          setDialogState({
            kind: "downloading",
            version: update.version,
          });

          const run = async (): Promise<void> => {
            try {
              await update.downloadAndInstall((event) => {
                setDownloadProgressTracker((currentTracker) =>
                  applyDownloadEvent(currentTracker, event),
                );
              });
              updateRef.current = O.none;
              setDialogState({
                kind: "ready",
                version: update.version,
              });
            } catch (error: unknown) {
              updateRef.current = O.none;
              const message = resolveErrorMessage(error);
              console.error(`[updater] failed to apply update: ${message}`);
              setDialogState(
                createFailedDialogState({
                  detail: message,
                  operation: "download-install",
                  version: O.some(update.version),
                }),
              );
            }
          };

          void run();
        },
      ),
    );
  }, [dialogState]);

  const onRestartNow = useCallback((): void => {
    const run = async (): Promise<void> => {
      try {
        const processModule = await import("@tauri-apps/plugin-process");
        await processModule.relaunch();
      } catch (error: unknown) {
        const message = resolveErrorMessage(error);
        console.error(`[updater] failed to relaunch: ${message}`);
        setDialogState(
          createFailedDialogState({
            detail: message,
            operation: "restart",
            version:
              dialogState.kind === "ready"
                ? O.some(dialogState.version)
                : O.none,
          }),
        );
      }
    };

    void run();
  }, [dialogState]);

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
      } catch (error: unknown) {
        console.info(
          `[updater] auto-update check skipped: ${resolveErrorMessage(error)}`,
        );
      }
    };

    void run();

    if (import.meta.env.DEV !== true) {
      runCheck(false);
    }

    return () => {
      updateRef.current = O.none;
    };
  }, [runCheck]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {
        return;
      };
    }

    const handleCheckRequest = (): void => {
      onCheckNow();
    };

    window.addEventListener(
      DESKTOP_AUTO_UPDATE_CHECK_REQUEST_EVENT_NAME,
      handleCheckRequest,
    );

    return () => {
      window.removeEventListener(
        DESKTOP_AUTO_UPDATE_CHECK_REQUEST_EVENT_NAME,
        handleCheckRequest,
      );
    };
  }, [onCheckNow]);

  const progressPercent = useMemo((): O.Option<number> => {
    if (dialogState.kind !== "downloading") {
      return O.none;
    }

    return resolveDownloadProgressPercent(downloadProgressTracker);
  }, [dialogState.kind, downloadProgressTracker]);

  return {
    dialogState,
    progressPercent,
    onCheckNow,
    onDialogClose,
    onUpdateNow,
    onRestartNow,
  };
};
