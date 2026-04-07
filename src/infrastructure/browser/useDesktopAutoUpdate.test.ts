import * as O from "fp-ts/Option";
import { describe, expect, test } from "vitest";
import {
  applyDownloadEvent,
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
});
