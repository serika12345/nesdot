import { type OamSpriteEntry } from "../nes/nesProject";
import { type SpriteInScreen } from "../project/project";

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
    (sprite.priority === "behindBg" ? 0b0010_0000 : 0) |
    (sprite.flipH === true ? 0b0100_0000 : 0) |
    (sprite.flipV === true ? 0b1000_0000 : 0),
});
