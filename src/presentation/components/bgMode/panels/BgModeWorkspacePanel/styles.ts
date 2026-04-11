import type { BoxProps } from "@mui/material/Box";
import type { GridProps } from "@mui/material/Grid";
import type { StackProps } from "@mui/material/Stack";
import type { CSSProperties } from "react";

export const chevronStyle = (open: boolean): CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

export const tileLibraryGridProps: GridProps = {
  container: true,
  columns: { xs: 2, sm: 3, md: 4 },
  spacing: 1.5,
};

export const tileButtonLayoutProps: StackProps = {
  alignItems: "center",
  spacing: 1,
  useFlexGap: true,
  width: "100%",
};

export const canvasOverlayRootProps: BoxProps = {
  position: "absolute",
  top: 2.25,
  left: 2.25,
  zIndex: 2,
  style: { pointerEvents: "none" },
};

export const overlayToggleButtonStyle: CSSProperties = {
  pointerEvents: "auto",
};

export const canvasOverlayMenuProps: StackProps = {
  spacing: 1.5,
  useFlexGap: true,
  mt: 1.5,
  width: "20rem",
  maxWidth: "calc(100vw - 4rem)",
  p: 1.5,
  style: {
    pointerEvents: "auto",
    borderRadius: "1.125rem",
    background: "rgba(255, 255, 255, 0.98)",
    border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 1.375rem 2.5rem rgba(15, 23, 42, 0.16)",
    backdropFilter: "blur(1.125rem)",
  },
};

export const mockToolbarProps: StackProps = {
  direction: "row",
  flexWrap: "wrap",
  alignItems: "center",
  spacing: 1.25,
  useFlexGap: true,
};

export const centeredCanvasWrapProps: GridProps = {
  container: true,
  width: "100%",
  height: "100%",
  minWidth: "100%",
  minHeight: "100%",
  justifyContent: "center",
  alignItems: "center",
};
