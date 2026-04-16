import type { CSSProperties } from "react";
import { createDisclosureChevronStyle } from "../../styleHelpers";

export const disclosureChevronStyle = createDisclosureChevronStyle;

export const transparentSwatchStyle: CSSProperties = {
  width: "2rem",
  height: "2rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  backgroundImage: "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
  backgroundSize: "0.5rem 0.5rem",
};

export const colorSwatchStyle = (hex: string): CSSProperties => ({
  width: "2rem",
  height: "2rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  backgroundColor: hex,
});

export const pickerPanelPaperStyle: CSSProperties = {
  padding: "0.875rem",
};

export const createColorLibraryButtonStyle = (
  hex: string,
  active: boolean,
): CSSProperties => ({
  minWidth: "2.25rem",
  width: "2.25rem",
  height: "2.25rem",
  padding: 0,
  backgroundColor: hex,
  borderColor: active ? "rgba(15, 23, 42, 0.85)" : "rgba(15, 23, 42, 0.18)",
});
