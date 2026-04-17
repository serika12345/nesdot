import type { CSSProperties } from "react";
import { createDisclosureChevronStyle } from "../../../common/ui/styleHelpers";

export const helperTextStyle: CSSProperties = {
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  color: "var(--ink-soft)",
};

export const fieldLabelStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
};

const badgeBaseStyle: CSSProperties = {
  width: "fit-content",
  padding: "0.4375rem 0.75rem",
  borderRadius: "62.4375rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

export const resolveBadgeStyle = (
  tone: "neutral" | "accent" | "danger",
): CSSProperties => {
  if (tone === "neutral") {
    return {
      ...badgeBaseStyle,
      color: "var(--ink-soft)",
      background: "rgba(148, 163, 184, 0.12)",
      border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
    };
  }

  if (tone === "accent") {
    return {
      ...badgeBaseStyle,
      color: "#0f766e",
      background: "rgba(15, 118, 110, 0.12)",
      border: "0.0625rem solid rgba(15, 118, 110, 0.18)",
    };
  }

  return {
    ...badgeBaseStyle,
    color: "#be123c",
    background: "rgba(190, 24, 93, 0.1)",
    border: "0.0625rem solid rgba(190, 24, 93, 0.16)",
  };
};

export const collapseChevronStyle = createDisclosureChevronStyle;

export const createFloatingDragPreviewStyle = (
  clientX: number,
  clientY: number,
): CSSProperties => ({
  position: "fixed",
  zIndex: 9997,
  pointerEvents: "none",
  minWidth: "4.25rem",
  padding: "0.5rem",
  left: clientX + 18,
  top: clientY + 18,
});

export const floatingDragPreviewStyle = (
  clientX: number,
  clientY: number,
): CSSProperties => ({
  left: clientX + 18,
  top: clientY + 18,
});

export const createScreenLibraryScrollAreaStyle = (
  maxHeight: string,
): CSSProperties => ({
  maxHeight,
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: "0.25rem",
  scrollbarGutter: "stable",
});

export const screenPreviewLabelStyle: CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
};

export const createScreenLibraryPreviewButtonStyle = (
  dragging: boolean,
): CSSProperties => ({
  width: "100%",
  minWidth: 0,
  minHeight: "6rem",
  padding: "0.5rem",
  cursor: dragging === true ? "grabbing" : "grab",
  touchAction: "none",
  userSelect: "none",
});

export const sidebarScrollStyle: CSSProperties = {
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarGutter: "stable",
};

export const createStageSurfaceStyle = (
  width: number,
  height: number,
  dragging: boolean,
): CSSProperties => ({
  width,
  height,
  position: "relative",
  touchAction: "none",
  userSelect: "none",
  cursor: dragging === true ? "grabbing" : "default",
});

export const stageInteractionLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 3,
};

export const createSpriteOutlineStyle = (
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  visible: boolean,
  selected: boolean,
): CSSProperties => {
  const geometry = createScaledRectStyle(x, y, width, height, scale);

  if (visible === false) {
    return {
      ...geometry,
      position: "absolute",
      borderRadius: 0,
      pointerEvents: "none",
      border: "none",
      background: "transparent",
    };
  }

  if (selected === true) {
    return {
      ...geometry,
      position: "absolute",
      borderRadius: 0,
      pointerEvents: "none",
      border: "0.125rem solid rgba(20, 184, 166, 0.92)",
      background: "rgba(45, 212, 191, 0.1)",
    };
  }

  return {
    ...geometry,
    position: "absolute",
    borderRadius: 0,
    pointerEvents: "none",
    border: "0.0625rem solid rgba(148, 163, 184, 0.68)",
    background: "rgba(255, 255, 255, 0.02)",
  };
};

export const stageSpriteIndexStyle: CSSProperties = {
  position: "absolute",
  left: "0.1875rem",
  top: "0.1875rem",
  borderRadius: "999px",
  padding: "0.125rem 0.375rem",
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.66)",
  lineHeight: 1.2,
};

export const createStageMarqueeStyle = (
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
): CSSProperties => ({
  ...createScaledRectStyle(x, y, width, height, scale),
  position: "absolute",
  border: "0.0625rem solid rgba(45, 212, 191, 0.9)",
  background: "rgba(45, 212, 191, 0.12)",
  borderRadius: "0.375rem",
  pointerEvents: "none",
});

export const createScaledRectStyle = (
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
): CSSProperties => ({
  left: x * scale,
  top: y * scale,
  width: width * scale,
  height: height * scale,
});
