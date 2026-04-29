export type ColorIndexOfPalette = 0 | 1 | 2 | 3;
export type PaletteIndex = 0 | 1 | 2 | 3;
export type SpritePriority = "front" | "behindBg";
export type ProjectSpriteSize = 8 | 16;

export interface SpriteTile {
  width: 8;
  height: 8 | 16;
  paletteIndex: PaletteIndex;
  pixels: ColorIndexOfPalette[][];
}

export type SpriteInScreen = SpriteTile & {
  x: number;
  y: number;
  spriteIndex: number;
  priority: SpritePriority;
  flipH: boolean;
  flipV: boolean;
};

/**
 * 指定サイズとパレット番号で空のスプライトタイルを生成します。
 * 新規スプライトやリサイズ後の初期値を、透明ピクセルで一貫して用意するための関数です。
 */
export const createEmptySpriteTile = (
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex = 0,
): SpriteTile => ({
  width: 8,
  height,
  paletteIndex,
  pixels: Array.from({ length: height }, () =>
    Array.from({ length: 8 }, () => 0),
  ),
});
