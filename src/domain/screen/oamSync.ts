import { NesProjectState, OamSpriteEntry } from "../nes/nesProject";
import { Screen, SpriteInScreen } from "../project/project";

const toPriorityBit = (priority: SpriteInScreen["priority"]): number =>
  priority === "behindBg" ? 0b0010_0000 : 0;

const toFlipHBit = (flipH: boolean): number =>
  flipH === true ? 0b0100_0000 : 0;

const toFlipVBit = (flipV: boolean): number =>
  flipV === true ? 0b1000_0000 : 0;

/**
 * 画面編集用スプライトを NES OAM エントリへ変換します。
 * UI で扱う位置や反転情報を、PPU が読む属性ビット付きの表現へ落とし込む役割があります。
 */
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

/**
 * スクリーン上のスプライト一覧を NES 状態の OAM へ反映します。
 * 画面編集結果と NES 側の実機表現を同期し、両者の食い違いを防ぐための関数です。
 */
export const mergeScreenIntoNesOam = (
  nesState: NesProjectState,
  screen: Screen,
): NesProjectState => ({
  ...nesState,
  oam: screen.sprites.map(toOamEntryFromScreenSprite),
});
