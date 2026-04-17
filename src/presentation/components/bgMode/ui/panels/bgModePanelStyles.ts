import type { BoxProps } from "@mui/material/Box";
import type { GridProps } from "@mui/material/Grid";
import type { StackProps } from "@mui/material/Stack";
import type { CSSProperties } from "react";
import {
  createDisclosureChevronStyle,
  floatingOverlayPanelSurfaceStyle,
} from "../../../common/ui/styleHelpers";

export const chevronStyle = createDisclosureChevronStyle;

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
    ...floatingOverlayPanelSurfaceStyle,
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
