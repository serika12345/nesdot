import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { EmptyTilePreview } from "../../../characterMode/ui/primitives/CharacterModePrimitives";
import { createCharacterPreviewCanvasStyle } from "./ScreenModeCharacterPreviewStyle";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

interface ScreenModeCharacterPreviewProps {
  maxHeightPx: number;
  maxWidthPx: number;
  preferredScale: number;
  previewGrid: O.Option<ReadonlyArray<ReadonlyArray<string>>>;
}

interface CharacterPreviewMetrics {
  canvasHeight: number;
  canvasWidth: number;
  displayHeight: number;
  displayWidth: number;
  logicalHeight: number;
  logicalWidth: number;
  scale: number;
}

const resolveLogicalGridWidth = (
  previewGrid: ReadonlyArray<ReadonlyArray<string>>,
): number =>
  previewGrid.reduce(
    (logicalWidth, row) => Math.max(logicalWidth, row.length),
    0,
  );

const resolveCharacterPreviewMetrics = (params: {
  maxHeightPx: number;
  maxWidthPx: number;
  preferredScale: number;
  previewGrid: O.Option<ReadonlyArray<ReadonlyArray<string>>>;
}): O.Option<CharacterPreviewMetrics> =>
  pipe(
    params.previewGrid,
    O.chain((previewGrid) => {
      const logicalHeight = previewGrid.length;
      const logicalWidth = resolveLogicalGridWidth(previewGrid);

      if (logicalHeight <= 0 || logicalWidth <= 0) {
        return O.none;
      }

      const scale = Math.max(
        1,
        Math.min(
          params.preferredScale,
          Math.max(1, Math.floor(params.maxWidthPx / logicalWidth)),
          Math.max(1, Math.floor(params.maxHeightPx / logicalHeight)),
        ),
      );
      const canvasWidth = logicalWidth * scale;
      const canvasHeight = logicalHeight * scale;
      const fitRatio = Math.min(
        1,
        params.maxWidthPx / canvasWidth,
        params.maxHeightPx / canvasHeight,
      );

      return O.some({
        canvasHeight,
        canvasWidth,
        displayHeight: canvasHeight * fitRatio,
        displayWidth: canvasWidth * fitRatio,
        logicalHeight,
        logicalWidth,
        scale,
      });
    }),
  );

const drawCharacterPreview = (
  context: CanvasRenderingContext2D,
  previewGrid: ReadonlyArray<ReadonlyArray<string>>,
  metrics: CharacterPreviewMetrics,
): void => {
  context.clearRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
  Object.assign(context, { imageSmoothingEnabled: false });

  previewGrid.forEach((row, rowIndex) => {
    row.forEach((colorHex, columnIndex) => {
      if (colorHex === PREVIEW_TRANSPARENT_HEX) {
        return;
      }

      Object.assign(context, { fillStyle: colorHex });
      context.fillRect(
        columnIndex * metrics.scale,
        rowIndex * metrics.scale,
        metrics.scale,
        metrics.scale,
      );
    });
  });
};

export const ScreenModeCharacterPreview: React.FC<
  ScreenModeCharacterPreviewProps
> = ({ maxHeightPx, maxWidthPx, preferredScale, previewGrid }) => {
  const canvasElementRef = React.useRef<O.Option<HTMLCanvasElement>>(O.none);
  const previewMetrics = React.useMemo(
    () =>
      resolveCharacterPreviewMetrics({
        maxHeightPx,
        maxWidthPx,
        preferredScale,
        previewGrid,
      }),
    [maxHeightPx, maxWidthPx, preferredScale, previewGrid],
  );

  const handleCanvasRef = React.useCallback(
    (element: HTMLCanvasElement | null) => {
      Object.assign(canvasElementRef, {
        current: O.fromNullable(element),
      });
    },
    [],
  );

  React.useEffect(() => {
    if (O.isNone(previewGrid) || O.isNone(previewMetrics)) {
      return;
    }

    const canvasElementOption = canvasElementRef.current;
    if (O.isNone(canvasElementOption)) {
      return;
    }

    const contextOption = O.fromNullable(
      canvasElementOption.value.getContext("2d"),
    );
    if (O.isNone(contextOption)) {
      return;
    }

    drawCharacterPreview(
      contextOption.value,
      previewGrid.value,
      previewMetrics.value,
    );
  }, [previewGrid, previewMetrics]);

  if (O.isNone(previewMetrics)) {
    return (
      <EmptyTilePreview
        previewWidth={Math.min(maxWidthPx, preferredScale * 8)}
        previewHeight={Math.min(maxHeightPx, preferredScale * 8)}
      />
    );
  }

  return (
    <canvas
      ref={handleCanvasRef}
      width={previewMetrics.value.canvasWidth}
      height={previewMetrics.value.canvasHeight}
      style={createCharacterPreviewCanvasStyle(
        previewMetrics.value.displayWidth,
        previewMetrics.value.displayHeight,
      )}
      aria-hidden="true"
    />
  );
};
