import type { CSSProperties } from "react";
import { createDisclosureChevronStyle } from "../../../common/ui/styleHelpers";

export const screenModePreviewViewportStyle = (
  style: CSSProperties,
  active: boolean,
): CSSProperties => ({
  ...style,
  cursor: active === true ? "grabbing" : "default",
});

export const collapseChevronStyle = createDisclosureChevronStyle;
