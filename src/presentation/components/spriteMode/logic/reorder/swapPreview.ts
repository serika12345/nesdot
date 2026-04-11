import * as O from "fp-ts/Option";

interface SwapPreviewTile {
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

/**
 * ポインタ位置から入れ替え対象の 8x8 タイル左上座標を求めます。
 * キャンバス外を除外しつつ、並べ替えプレビューが参照しやすいタイル単位へ丸めるための関数です。
 */
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
