import * as O from "fp-ts/Option";

export interface SwapPreviewTile {
  tileX: number;
  tileY: number;
}

const isCellInsideCanvas = (
  cellX: number,
  cellY: number,
  width: number,
  height: number,
): boolean => cellX >= 0 && cellY >= 0 && cellX < width && cellY < height;

const to8x8TileStart = (cell: number): number => Math.floor(cell / 8) * 8;

export const getSwapPreviewTile = (
  cellX: number,
  cellY: number,
  width: number,
  height: number,
): O.Option<SwapPreviewTile> => {
  if (isCellInsideCanvas(cellX, cellY, width, height) === false) {
    return O.none;
  }

  return O.some({
    tileX: to8x8TileStart(cellX),
    tileY: to8x8TileStart(cellY),
  });
};
