import * as O from "fp-ts/Option";
import { ColorIndexOfPalette } from "../project/project";
import { getMatrixItem } from "../../shared/arrayAccess";

/**
 * 2 つの 8x8 ブロックをピクセル配列内で入れ替えます。
 * スプライト並べ替えモードが局所的なタイル交換だけを不変更新で行えるようにする関数です。
 */
export function swap8x8Blocks(
  srcPixels: ColorIndexOfPalette[][],
  ax: number,
  ay: number,
  bx: number,
  by: number,
): ColorIndexOfPalette[][] {
  const isIn8x8 = (x: number, y: number, left: number, top: number): boolean =>
    x >= left && x < left + 8 && y >= top && y < top + 8;

  const readPixel = (
    pixels: ColorIndexOfPalette[][],
    x: number,
    y: number,
  ): O.Option<ColorIndexOfPalette> => getMatrixItem(pixels, y, x);

  return srcPixels.map((row, y) =>
    row.map((pixel, x) => {
      const inA = isIn8x8(x, y, ax, ay);
      const inB = isIn8x8(x, y, bx, by);

      if (inA === true) {
        const mappedX = bx + (x - ax);
        const mappedY = by + (y - ay);
        const mappedPixel = readPixel(srcPixels, mappedX, mappedY);
        return O.getOrElse(() => pixel)(mappedPixel);
      }

      if (inB === true) {
        const mappedX = ax + (x - bx);
        const mappedY = ay + (y - by);
        const mappedPixel = readPixel(srcPixels, mappedX, mappedY);
        return O.getOrElse(() => pixel)(mappedPixel);
      }

      return pixel;
    }),
  );
}
