import type { BoxProps } from "@mui/material/Box";
import type { CSSProperties } from "react";
import {
  createDisclosureChevronStyle,
  floatingOverlayPanelSurfaceStyle,
} from "../../../../common/ui/styleHelpers";

export const chevronStyle = createDisclosureChevronStyle;

export const overlayRootProps: BoxProps = {
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 4,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  style: { pointerEvents: "none" },
};

export const overlayToggleButtonStyle: CSSProperties = {
  pointerEvents: "auto",
};

export const overlayCollapsedToggleButtonStyle: CSSProperties = {
  pointerEvents: "auto",
  width: "2.5rem",
  height: "2.5rem",
  borderRadius: "999px",
  border: "0.0625rem solid rgba(15, 118, 110, 0.24)",
  background: "rgba(255, 255, 255, 0.96)",
  boxShadow: "0 0.75rem 1.5rem rgba(15, 23, 42, 0.12)",
};

export const overlayMenuProps: BoxProps = {
  mt: 1.5,
  width: "20rem",
  style: {
    pointerEvents: "auto",
    ...floatingOverlayPanelSurfaceStyle,
  },
};
