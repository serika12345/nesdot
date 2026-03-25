import { NesProjectState } from "../store/nesProjectState";
import { Palettes } from "../store/projectState";

export const resolveScreenRenderPalettes = (
  legacyPalettes: Palettes,
  nes?: NesProjectState,
): Palettes => {
  if (nes === undefined) {
    return legacyPalettes;
  }

  return nes.backgroundPalettes;
};

export const resolveSpriteRenderPalettes = (
  legacyPalettes: Palettes,
  nes?: NesProjectState,
): Palettes => {
  if (nes === undefined) {
    return legacyPalettes;
  }

  return nes.spritePalettes;
};
