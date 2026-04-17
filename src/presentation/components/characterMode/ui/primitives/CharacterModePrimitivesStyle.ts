import { styled } from "@mui/material/styles";
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

export const CharacterStageSurfaceRoot = styled("div", {
  shouldForwardProp: (prop) => prop !== "activeDropState",
})<{ activeDropState: boolean }>(({ activeDropState }) => ({
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98))",
  boxShadow:
    "0 1.75rem 3.75rem rgba(15, 23, 42, 0.22), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.92)",
  transition:
    "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  border:
    activeDropState === true
      ? "0.0625rem solid rgba(45, 212, 191, 0.72)"
      : "0.0625rem solid rgba(148, 163, 184, 0.22)",
  transform: activeDropState === true ? "scale(1.01)" : "none",
  "&:focus-visible": {
    outline: "0.125rem solid rgba(15, 118, 110, 0.92)",
    outlineOffset: "0.25rem",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: [
      "linear-gradient(rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
      "linear-gradient(90deg, rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
      "linear-gradient(rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
      "linear-gradient(90deg, rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
    ].join(", "),
    backgroundSize: [
      "var(--stage-cell-size) var(--stage-cell-size)",
      "var(--stage-cell-size) var(--stage-cell-size)",
      "var(--stage-grid-size) var(--stage-grid-size)",
      "var(--stage-grid-size) var(--stage-grid-size)",
    ].join(", "),
    opacity: 0.95,
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: [
      "linear-gradient(rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
      "linear-gradient(90deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
    ].join(", "),
    backgroundSize:
      "0.0625rem var(--stage-height-px), var(--stage-width-px) 0.0625rem",
    backgroundPosition: "var(--stage-mid-x) 0, 0 var(--stage-mid-y)",
    backgroundRepeat: "no-repeat",
    pointerEvents: "none",
  },
}));

export const characterStageSurfaceGridStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: [
    "linear-gradient(rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
    "linear-gradient(90deg, rgba(148, 163, 184, 0.18) 0.0625rem, transparent 0.0625rem)",
    "linear-gradient(rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
    "linear-gradient(90deg, rgba(148, 163, 184, 0.15) 0.0625rem, transparent 0.0625rem)",
  ].join(", "),
  backgroundSize: [
    "var(--stage-cell-size) var(--stage-cell-size)",
    "var(--stage-cell-size) var(--stage-cell-size)",
    "var(--stage-grid-size) var(--stage-grid-size)",
    "var(--stage-grid-size) var(--stage-grid-size)",
  ].join(", "),
  opacity: 0.95,
  pointerEvents: "none",
};

export const characterStageSurfaceAxisStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: [
    "linear-gradient(rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
    "linear-gradient(90deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
  ].join(", "),
  backgroundSize:
    "0.0625rem var(--stage-height-px), var(--stage-width-px) 0.0625rem",
  backgroundPosition: "var(--stage-mid-x) 0, 0 var(--stage-mid-y)",
  backgroundRepeat: "no-repeat",
  pointerEvents: "none",
};

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
