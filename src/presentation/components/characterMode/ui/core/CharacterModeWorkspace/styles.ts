import type { BoxProps } from "@mui/material/Box";
import type { CSSProperties } from "react";

export const workspaceGateProps: BoxProps = {
  position: "relative",
  minHeight: 0,
  minWidth: 0,
  flex: "1 1 0",
  display: "flex",
};

export const workspaceLockOverlayProps: BoxProps = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  style: {
    borderRadius: "1.25rem",
    border: "0.0625rem solid rgba(148, 163, 184, 0.26)",
    background: "rgba(248, 250, 252, 0.76)",
    backdropFilter: "blur(1.5px)",
  },
};

export const workspaceLockMessageStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "0.625rem 0.875rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.28)",
  color: "var(--ink-strong)",
  fontSize: "0.8125rem",
  fontWeight: 700,
  letterSpacing: "0.05em",
};
