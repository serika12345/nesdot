import type { CSSProperties } from "react";

export const workspaceLockOverlayStyle: CSSProperties = {
  backdropFilter: "blur(1.5px)",
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
