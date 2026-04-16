import type { CSSProperties } from "react";

export const createOverlayStyle = (
  left: number,
  top: number,
  width: number,
  height: number,
): CSSProperties => ({
  left,
  top,
  width,
  height,
});
