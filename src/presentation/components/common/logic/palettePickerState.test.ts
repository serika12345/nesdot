import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "../../../../domain/nes/nesProject";
import { applyPalettePickerColorSelection } from "./palettePickerState";

describe("applyPalettePickerColorSelection", () => {
  it("updates the selected slot in both background and sprite palettes", () => {
    const nes = createDefaultNesProjectState();

    const nextNes = applyPalettePickerColorSelection(nes, 2, 3, 15);

    expect(nextNes.backgroundPalettes[2][3]).toBe(15);
    expect(nextNes.spritePalettes[2][3]).toBe(15);
    expect(nextNes.backgroundPalettes[1]).toEqual(nes.backgroundPalettes[1]);
    expect(nextNes.spritePalettes[0]).toEqual(nes.spritePalettes[0]);
    expect(nes.backgroundPalettes[2][3]).toBe(34);
    expect(nes.spritePalettes[2][3]).toBe(34);
  });

  it("preserves unrelated nes state fields", () => {
    const nes = createDefaultNesProjectState();

    const nextNes = applyPalettePickerColorSelection(nes, 1, 1, 22);

    expect(nextNes.chrBytes).toBe(nes.chrBytes);
    expect(nextNes.nameTable).toBe(nes.nameTable);
    expect(nextNes.attributeTable).toBe(nes.attributeTable);
    expect(nextNes.universalBackgroundColor).toBe(nes.universalBackgroundColor);
    expect(nextNes.ppuControl).toBe(nes.ppuControl);
  });
});
