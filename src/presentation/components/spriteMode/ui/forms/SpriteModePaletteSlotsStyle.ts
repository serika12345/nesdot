import type { CSSProperties } from "react";

export const slotSwatchStyle = (
  transparent: boolean,
  colorHex: string,
): CSSProperties => {
  if (transparent === true) {
    return {
      width: "1.5rem",
      height: "1.5rem",
      borderRadius: "0.5rem",
      border: "1px solid rgba(148, 163, 184, 0.4)",
      backgroundImage:
        "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
      backgroundSize: "0.5rem 0.5rem",
    };
  }

  return {
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    backgroundColor: colorHex,
  };
};
