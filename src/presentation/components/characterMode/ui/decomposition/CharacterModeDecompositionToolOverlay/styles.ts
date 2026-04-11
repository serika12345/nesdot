import type { BoxProps } from "@mui/material/Box";
import type { CSSProperties } from "react";

export const chevronStyle = (open: boolean): CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

export const overlayRootProps: BoxProps = {
  position: "absolute",
  top: 0,
  right: 0,
  zIndex: 4,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  style: { pointerEvents: "none" },
};

export const overlayToggleButtonStyle: CSSProperties = {
  pointerEvents: "auto",
};

export const overlayMenuProps: BoxProps = {
  mt: 1.5,
  width: "20rem",
  style: {
    pointerEvents: "auto",
    borderRadius: "1.125rem",
    background: "rgba(255, 255, 255, 0.98)",
    border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 1.375rem 2.5rem rgba(15, 23, 42, 0.16)",
    backdropFilter: "blur(1.125rem)",
  },
};
