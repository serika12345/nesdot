import type { CSSProperties } from "react";

export const createCharacterPreviewCanvasStyle = (
  displayWidth: number,
  displayHeight: number,
): CSSProperties => ({
  display: "block",
  width: `${displayWidth}px`,
  height: `${displayHeight}px`,
  imageRendering: "pixelated",
});
