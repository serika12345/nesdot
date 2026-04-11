import type { CSSProperties } from "react";

export const createPaletteSlotButtonStyle = (
  style: CSSProperties,
  colorHex: string,
): CSSProperties => ({
  ...style,
  backgroundColor: colorHex,
});
