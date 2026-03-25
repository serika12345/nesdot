import * as O from "fp-ts/Option";
import { ColorIndexOfPalette } from "../store/projectState";
import { getArrayItem, getMatrixItem } from "../utils/arrayAccess";

export function swap8x8Blocks(
  srcPixels: ColorIndexOfPalette[][],
  ax: number,
  ay: number,
  bx: number,
  by: number,
): ColorIndexOfPalette[][] {
  const next: ColorIndexOfPalette[][] = srcPixels.map((row) => row.slice());

  Array.from({ length: 8 }, (_, dy) => dy).forEach((dy) => {
    Array.from({ length: 8 }, (_, dx) => dx).forEach((dx) => {
      const sourceY = ay + dy;
      const sourceX = ax + dx;
      const targetY = by + dy;
      const targetX = bx + dx;

      if (sourceY < 0 || sourceY >= next.length) return;
      if (targetY < 0 || targetY >= next.length) return;
      const sourceRowOption = getArrayItem(next, sourceY);
      const targetRowOption = getArrayItem(next, targetY);
      if (O.isNone(sourceRowOption) || O.isNone(targetRowOption)) return;
      if (sourceX < 0 || sourceX >= sourceRowOption.value.length) return;
      if (targetX < 0 || targetX >= targetRowOption.value.length) return;

      const sourcePixelOption = getMatrixItem(next, sourceY, sourceX);
      const targetPixelOption = getMatrixItem(next, targetY, targetX);
      if (O.isNone(sourcePixelOption) || O.isNone(targetPixelOption)) return;

      sourceRowOption.value[sourceX] = targetPixelOption.value;
      targetRowOption.value[targetX] = sourcePixelOption.value;
    });
  });

  return next;
}
