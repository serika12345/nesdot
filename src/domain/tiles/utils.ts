import {
  type ColorIndexOfPalette,
  type PaletteIndex,
  type SpriteTile,
} from "../project/project";

/**
 * 指定サイズとパレットでスプライトタイルを生成します。
 * 透明色で初期化した編集用タイルを、幅 8 固定のドメイン制約付きで作ることを意図しています。
 */
export function makeTile(
  height: 8 | 16,
  paletteIndex: PaletteIndex,
  fill: ColorIndexOfPalette = 0,
): SpriteTile {
  const width: 8 = 8;
  const pixels: ColorIndexOfPalette[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => fill),
  );
  return { width, height, pixels, paletteIndex };
}
