import type { CSSProperties } from "react";
import { createDisclosureChevronStyle } from "../../../../common/ui/styleHelpers";

export const collapseChevronStyle = createDisclosureChevronStyle;

export const characterLibraryScrollAreaStyle: CSSProperties = {
  scrollbarGutter: "stable",
};

export const createCharacterLibraryInteractionRootStyle = (
  interactive: boolean,
): CSSProperties => ({
  cursor: interactive === true ? "grab" : "default",
});

export const createCharacterLibraryPreviewButtonStyle = (
  dragging: boolean,
): CSSProperties => ({
  width: "100%",
  minHeight: "7.375rem",
  padding: "0.75rem",
  cursor: dragging === true ? "grabbing" : "grab",
  userSelect: "none",
  touchAction: "none",
});

export const characterLibrarySpriteTitleStyle: CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "var(--ink-soft)",
};

export const characterLibraryPreviewFrameStyle: CSSProperties = {
  width: "5.5rem",
  minHeight: "4rem",
};
