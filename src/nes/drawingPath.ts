import { NesProjectState, NesSpritePalettes } from "../store/nesProjectState";

export const resolveScreenRenderPalettes = (
  nes: NesProjectState,
): NesProjectState["backgroundPalettes"] => nes.backgroundPalettes;

export const resolveSpriteRenderPalettes = (
  nes: NesProjectState,
): NesSpritePalettes => nes.spritePalettes;
