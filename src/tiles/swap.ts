import { ColorIndexOfPalette } from "../store/projectState";

export function swap8x8Blocks(
  srcPixels: ColorIndexOfPalette[][],
  ax: number,
  ay: number,
  bx: number,
  by: number,
): ColorIndexOfPalette[][] {
  const next = srcPixels.map((row) => row.slice()) as ColorIndexOfPalette[][];

  Array.from({ length: 8 }, (_, dy) => dy).forEach((dy) => {
    Array.from({ length: 8 }, (_, dx) => dx).forEach((dx) => {
      const sourceY = ay + dy;
      const sourceX = ax + dx;
      const targetY = by + dy;
      const targetX = bx + dx;

      if (sourceY < 0 || sourceY >= next.length) return;
      if (targetY < 0 || targetY >= next.length) return;
      if (sourceX < 0 || sourceX >= next[sourceY].length) return;
      if (targetX < 0 || targetX >= next[targetY].length) return;

      const tmp = next[sourceY][sourceX];
      next[sourceY][sourceX] = next[targetY][targetX];
      next[targetY][targetX] = tmp as ColorIndexOfPalette;
    });
  });

  return next;
}
