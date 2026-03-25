import { NesProjectState, OamSpriteEntry } from "../store/nesProjectState";
import { Screen, SpriteInScreen } from "../store/projectState";

const toPriorityBit = (priority: SpriteInScreen["priority"]): number =>
  priority === "behindBg" ? 0b0010_0000 : 0;

const toFlipHBit = (flipH: boolean): number =>
  flipH === true ? 0b0100_0000 : 0;

const toFlipVBit = (flipV: boolean): number =>
  flipV === true ? 0b1000_0000 : 0;

export const toOamEntryFromScreenSprite = (
  sprite: SpriteInScreen,
): OamSpriteEntry => ({
  x: sprite.x,
  y: sprite.y - 1,
  tileIndex: sprite.spriteIndex,
  attributeByte:
    sprite.paletteIndex |
    toPriorityBit(sprite.priority) |
    toFlipHBit(sprite.flipH) |
    toFlipVBit(sprite.flipV),
});

export const mergeScreenIntoNesOam = (
  nesState: NesProjectState,
  screen: Screen,
): NesProjectState => ({
  ...nesState,
  oam: screen.sprites.map(toOamEntryFromScreenSprite),
});
