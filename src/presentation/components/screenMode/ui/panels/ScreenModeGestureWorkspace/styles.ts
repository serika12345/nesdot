import type { CSSProperties } from "react";

export const collapseChevronStyle = (open: boolean): CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

export const floatingDragPreviewStyle = (
  clientX: number,
  clientY: number,
): CSSProperties => ({
  left: clientX + 18,
  top: clientY + 18,
});

export const sidebarScrollStyle: CSSProperties = {
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarGutter: "stable",
};

export const stageSurfaceStyle = (
  width: number,
  height: number,
): CSSProperties => ({
  width,
  height,
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
