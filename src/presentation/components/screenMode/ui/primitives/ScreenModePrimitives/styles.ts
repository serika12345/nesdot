import type { CSSProperties } from "react";

export const screenModePreviewViewportStyle = (
  style: CSSProperties,
  active: boolean,
): CSSProperties => ({
  ...style,
  cursor: active === true ? "grabbing" : "default",
});

export const collapseChevronStyle = (open: boolean): CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});
