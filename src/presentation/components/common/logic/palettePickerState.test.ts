import { describe, expect, it } from "vitest";
import { createDefaultProjectStateV2 } from "../../../../domain/project/projectV2";
import { applyPalettePickerColorSelection } from "./palettePickerState";

describe("applyPalettePickerColorSelection", () => {
  it("updates the selected slot in both background and sprite palettes", () => {
    const palettes = createDefaultProjectStateV2().palettes;

    const nextPalettes = applyPalettePickerColorSelection(palettes, 2, 3, 15);

    expect(nextPalettes.background[2][3]).toBe(15);
    expect(nextPalettes.sprite[2][3]).toBe(15);
    expect(nextPalettes.background[1]).toEqual(palettes.background[1]);
    expect(nextPalettes.sprite[0]).toEqual(palettes.sprite[0]);
    expect(palettes.background[2][3]).toBe(34);
    expect(palettes.sprite[2][3]).toBe(34);
  });

  it("preserves unrelated palette state fields", () => {
    const palettes = createDefaultProjectStateV2().palettes;

    const nextPalettes = applyPalettePickerColorSelection(palettes, 1, 1, 22);

    expect(nextPalettes.universalBackgroundColor).toBe(
      palettes.universalBackgroundColor,
    );
  });
});
