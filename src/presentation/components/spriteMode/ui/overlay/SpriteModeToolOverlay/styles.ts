import type { CSSProperties } from "react";

export const chevronStyle = (open: boolean): CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

export const overlayRootStyle: CSSProperties = {
  position: "absolute",
  top: "1.125rem",
  left: "1.125rem",
  zIndex: 4,
};
