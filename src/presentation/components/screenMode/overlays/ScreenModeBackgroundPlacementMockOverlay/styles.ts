import type { CSSProperties } from "react";

export const overlayStaticStyle: CSSProperties = {
  borderRadius: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  border: "0.125rem dashed rgba(20, 184, 166, 0.9)",
  background: "rgba(45, 212, 191, 0.14)",
  boxShadow: "0 0 0 0.375rem rgba(45, 212, 191, 0.08)",
  pointerEvents: "none",
};

export const previewContainerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  opacity: 0.94,
};
