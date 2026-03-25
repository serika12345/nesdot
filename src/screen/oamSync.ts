import { NesProjectState, OamSpriteEntry } from "../store/nesProjectState";
import { Screen, SpriteInScreen } from "../store/projectState";

export const toOamEntryFromScreenSprite = (
  sprite: SpriteInScreen,
): OamSpriteEntry => ({
  x: sprite.x,
  y: sprite.y - 1,
  tileIndex: sprite.spriteIndex,
  attributeByte: sprite.paletteIndex,
});

export const mergeScreenIntoNesOam = (
  nesState: NesProjectState,
  screen: Screen,
): NesProjectState => ({
  ...nesState,
  oam: screen.sprites.map(toOamEntryFromScreenSprite),
});
