import type { CSSProperties } from "react";

export const toolMenuRootStyle: CSSProperties = {
  position: "absolute",
  top: "4.25rem",
  left: "1.125rem",
  zIndex: 3,
  bottom: "1.125rem",
  pointerEvents: "none",
};

export const toolMenuPaperStyle: CSSProperties = {
  pointerEvents: "auto",
  padding: "0.75rem",
  width: "8.5rem",
};
