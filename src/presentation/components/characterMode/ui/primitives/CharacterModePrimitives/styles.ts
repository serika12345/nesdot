import type { CSSProperties } from "react";

type StageSurfaceStyle = CSSProperties & {
  "--stage-cell-size": string;
  "--stage-grid-size": string;
  "--stage-height-px": string;
  "--stage-mid-x": string;
  "--stage-mid-y": string;
  "--stage-width-px": string;
};

export const createDecompositionCanvasStyle = (
  style: CSSProperties,
  cursorStyle: string,
): CSSProperties => ({
  ...style,
  cursor: cursorStyle,
});

export const createStageDragPreviewStyle = (
  style: CSSProperties,
  previewLeft: number,
  previewTop: number,
): CSSProperties => ({
  ...style,
  left: previewLeft,
  top: previewTop,
});

export const createRegionOverlayButtonStyle = (
  style: CSSProperties,
  regionLeft: number,
  regionTop: number,
  regionScale: number,
  regionHeightPx: number,
): CSSProperties => ({
  ...style,
  left: regionLeft,
  top: regionTop,
  width: 8 * regionScale,
  height: regionHeightPx,
});

export const createFloatingLibraryPreviewStyle = (
  style: CSSProperties,
  dragClientX: number,
  dragClientY: number,
): CSSProperties => ({
  ...style,
  left: dragClientX + 18,
  top: dragClientY + 18,
});

export const createPositionedActionMenuStyle = (
  style: CSSProperties,
  menuLeft: number,
  menuTop: number,
  menuWidth: number,
): CSSProperties => ({
  ...style,
  left: menuLeft,
  top: menuTop,
  width: menuWidth,
  borderRadius: "1.125rem",
  background: "rgba(255, 255, 255, 0.98)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
  boxShadow: "0 1.375rem 2.5rem rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(1.125rem)",
});

export const createEmptyTilePreviewStyle = (
  style: CSSProperties,
  previewWidth: number,
  previewHeight: number,
): CSSProperties => ({
  ...style,
  width: previewWidth,
  height: previewHeight,
});

export const createPixelPreviewCellStyle = (
  style: CSSProperties,
  pixelSize: number,
  colorHex: string,
): CSSProperties => ({
  ...style,
  width: pixelSize,
  height: pixelSize,
  backgroundColor: colorHex,
});

export const createStageSurfaceStyle = (
  style: CSSProperties,
  stageWidthPx: number,
  stageHeightPx: number,
  stageScale: number,
): StageSurfaceStyle => ({
  ...style,
  width: stageWidthPx,
  height: stageHeightPx,
  minWidth: stageWidthPx,
  minHeight: stageHeightPx,
  "--stage-cell-size": `${stageScale}px`,
  "--stage-grid-size": `${stageScale * 8}px`,
  "--stage-height-px": `${stageHeightPx}px`,
  "--stage-width-px": `${stageWidthPx}px`,
  "--stage-mid-x": `${Math.floor(stageWidthPx / 2)}px`,
  "--stage-mid-y": `${Math.floor(stageHeightPx / 2)}px`,
});
