import * as O from "fp-ts/Option";
import { describe, expect, test } from "vitest";
import {
  applyDownloadEvent,
  createFailedDialogState,
  createInitialDownloadProgressTracker,
  resolveDownloadProgressPercent,
} from "./useDesktopAutoUpdate";

describe("useDesktopAutoUpdate progress tracking", () => {
  test("calculates determinate progress when content length is known", () => {
    const started = applyDownloadEvent(createInitialDownloadProgressTracker(), {
      event: "Started",
      data: {
        contentLength: 400,
      },
    });
    const progressed = applyDownloadEvent(started, {
      event: "Progress",
      data: {
        chunkLength: 100,
      },
    });

    expect(resolveDownloadProgressPercent(progressed)).toEqual(O.some(25));
  });

  test("keeps progress indeterminate when content length is missing", () => {
    const started = applyDownloadEvent(createInitialDownloadProgressTracker(), {
      event: "Started",
      data: {},
    });
    const progressed = applyDownloadEvent(started, {
      event: "Progress",
      data: {
        chunkLength: 64,
      },
    });

    expect(resolveDownloadProgressPercent(progressed)).toEqual(O.none);
  });

  test("marks progress complete after finished event", () => {
    const started = applyDownloadEvent(createInitialDownloadProgressTracker(), {
      event: "Started",
      data: {
        contentLength: 200,
      },
    });
    const progressed = applyDownloadEvent(started, {
      event: "Progress",
      data: {
        chunkLength: 80,
      },
    });
    const finished = applyDownloadEvent(progressed, {
      event: "Finished",
    });

    expect(resolveDownloadProgressPercent(finished)).toEqual(O.some(100));
  });

  test("ignores invalid chunk sizes", () => {
    const started = applyDownloadEvent(createInitialDownloadProgressTracker(), {
      event: "Started",
      data: {
        contentLength: 100,
      },
    });
    const invalidProgress = applyDownloadEvent(started, {
      event: "Progress",
      data: {
        chunkLength: -20,
      },
    });

    expect(resolveDownloadProgressPercent(invalidProgress)).toEqual(O.some(0));
  });

  test("builds detailed failure information for download and install errors", () => {
    expect(
      createFailedDialogState({
        detail: "署名検証に失敗しました",
        operation: "download-install",
        version: O.some("0.1.7"),
      }),
    ).toEqual({
      kind: "failed",
      detail: "署名検証に失敗しました",
      message: "ダウンロードまたはインストール処理で問題が発生しました。",
      operationLabel: "ダウンロード / インストール",
      recoveryHint:
        "ネットワーク接続、配布ファイル、署名を確認してから再度お試しください。",
      versionLabel: "0.1.7",
    });
  });

  test("builds restart failure information with a manual relaunch hint", () => {
    expect(
      createFailedDialogState({
        detail: "process relaunch not permitted",
        operation: "restart",
        version: O.none,
      }),
    ).toEqual({
      kind: "failed",
      detail: "process relaunch not permitted",
      message: "再起動処理で問題が発生しました。",
      operationLabel: "再起動",
      recoveryHint:
        "更新は適用済みの可能性があります。アプリを手動で終了して再起動してください。",
      versionLabel: "不明",
    });
  });
});
