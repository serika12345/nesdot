import type { CSSProperties } from "react";
import { floatingOverlayPanelSurfaceStyle } from "../../../common/ui/styleHelpers";

type StageSurfaceStyle = CSSProperties & {
  "--stage-cell-size": string;
  "--stage-grid-size": string;
  "--stage-height-px": string;
  "--stage-mid-x": string;
  "--stage-mid-y": string;
  "--stage-width-px": string;
};

export const createCharacterStageViewportStyle = (
  style: CSSProperties,
  dragging: boolean,
): CSSProperties => ({
  ...style,
  cursor: dragging === true ? "grabbing" : "default",
});

export const characterStageCanvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

export const createDecompositionCanvasStyle = (
  style: CSSProperties,
  cursorStyle: string,
): CSSProperties => ({
  ...characterStageCanvasStyle,
  ...style,
  cursor: cursorStyle,
  imageRendering: "pixelated",
});

export const createStageDragPreviewStyle = (
  style: CSSProperties,
  previewLeft: number,
  previewTop: number,
): CSSProperties => ({
  ...style,
  position: "absolute",
  opacity: 0.6,
  pointerEvents: "none",
  outline: "0.125rem dashed rgba(15, 118, 110, 0.72)",
  borderRadius: "0.5rem",
  boxShadow: "0 0 0 0.375rem rgba(15, 118, 110, 0.12)",
  background: "rgba(255, 255, 255, 0.72)",
  padding: "0.125rem",
  left: previewLeft,
  top: previewTop,
});

export const createRegionOverlayButtonStyle = (
  style: CSSProperties,
  regionLeft: number,
  regionTop: number,
  regionScale: number,
  regionHeightPx: number,
  issueState: boolean,
  selectedState: boolean,
  toolMode: "pen" | "eraser" | "region",
): CSSProperties => ({
  ...style,
  position: "absolute",
  padding: "0.375rem",
  left: regionLeft,
  top: regionTop,
  width: 8 * regionScale,
  height: regionHeightPx,
  border:
    issueState === true
      ? "0.125rem solid rgba(190, 24, 93, 0.92)"
      : "0.125rem solid rgba(15, 118, 110, 0.92)",
  background:
    issueState === true
      ? "rgba(255, 241, 242, 0.18)"
      : "rgba(240, 253, 250, 0.18)",
  boxShadow:
    selectedState === true ? "0 0 0 0.375rem rgba(190, 24, 93, 0.12)" : "none",
  cursor: toolMode === "region" ? "grab" : "default",
  pointerEvents: toolMode === "region" ? "auto" : "none",
});

export const createFloatingLibraryPreviewStyle = (
  style: CSSProperties,
  dragClientX: number,
  dragClientY: number,
): CSSProperties => ({
  ...style,
  position: "fixed",
  zIndex: 200,
  pointerEvents: "none",
  width: "4rem",
  minHeight: "4rem",
  padding: "0.625rem",
  borderRadius: "1.125rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 1.125rem 2.125rem rgba(15, 23, 42, 0.18)",
  opacity: 0.92,
  left: dragClientX + 18,
  top: dragClientY + 18,
});

export const createPortalOverlayStyle = (
  style: CSSProperties,
): CSSProperties => ({
  ...style,
  position: "fixed",
  inset: 0,
  zIndex: 320,
});

export const createPositionedActionMenuStyle = (
  style: CSSProperties,
  menuLeft: number,
  menuTop: number,
  menuWidth: number,
  ready: boolean,
): CSSProperties => ({
  ...style,
  left: menuLeft,
  top: menuTop,
  width: menuWidth,
  visibility: ready === true ? "visible" : "hidden",
  ...floatingOverlayPanelSurfaceStyle,
});

export const createEmptyTilePreviewStyle = (
  style: CSSProperties,
  previewWidth: number,
  previewHeight: number,
): CSSProperties => ({
  ...style,
  borderRadius: "0.5rem",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02))",
  border: "0.0625rem dashed rgba(148, 163, 184, 0.34)",
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
  flexShrink: 0,
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
