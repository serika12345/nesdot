import type { CSSProperties } from "react";

export const chevronStyle = (open: boolean): CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});
