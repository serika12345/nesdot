import type { CSSProperties } from "react";
import { createDisclosureChevronStyle } from "../../../common/ui/styleHelpers";

export const chevronStyle = createDisclosureChevronStyle;

export const overlayRootStyle: CSSProperties = {
  position: "absolute",
  top: "1.125rem",
  left: "1.125rem",
  zIndex: 4,
};
