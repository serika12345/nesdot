import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "./nesProject";
import {
  resolveScreenRenderPalettes,
  resolveSpriteRenderPalettes,
} from "./drawingPath";

describe("drawingPath", () => {
  it("returns NES background palettes", () => {
    const nes = createDefaultNesProjectState();
    expect(resolveScreenRenderPalettes(nes)).toEqual(nes.backgroundPalettes);
  });

  it("returns NES sprite palettes", () => {
    const nes = createDefaultNesProjectState();
    expect(resolveSpriteRenderPalettes(nes)).toEqual(nes.spritePalettes);
  });
});
