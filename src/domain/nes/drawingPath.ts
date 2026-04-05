import { NesProjectState, NesSpritePalettes } from "../nes/nesProject";

/**
 * スクリーン描画で使う背景パレット群を取り出します。
 * 背景描画とスプライト描画の責務を名前付きで分け、呼び出し側の意図を読みやすくします。
 */
export const resolveScreenRenderPalettes = (
  nes: NesProjectState,
): NesProjectState["backgroundPalettes"] => nes.backgroundPalettes;

/**
 * スプライト描画で使うスプライトパレット群を取り出します。
 * 描画経路ごとの参照先を明示し、表示ロジックの分岐を簡潔に保つための関数です。
 */
export const resolveSpriteRenderPalettes = (
  nes: NesProjectState,
): NesSpritePalettes => nes.spritePalettes;
