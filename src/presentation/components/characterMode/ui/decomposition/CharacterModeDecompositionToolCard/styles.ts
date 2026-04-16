import type { CSSProperties } from "react";

export const createPaletteSlotButtonStyle = (
  style: CSSProperties,
  colorHex: string,
  selectedState: boolean,
): CSSProperties => ({
  ...style,
  width: "2.625rem",
  height: "2.625rem",
  borderRadius: "0.875rem",
  backgroundColor: colorHex,
  border:
    selectedState === true
      ? "0.1875rem solid #0f766e"
      : "0.0625rem solid rgba(148, 163, 184, 0.28)",
  boxShadow:
    selectedState === true
      ? "0 0.75rem 1.5rem rgba(15, 118, 110, 0.16)"
      : "0 0.5rem 1rem rgba(15, 23, 42, 0.06)",
});
