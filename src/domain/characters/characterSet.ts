import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { renderSpriteTileToHexArray } from "../nes/rendering";
import { NesSpritePalettes } from "../nes/nesProject";
import { SpriteInScreen, SpriteTile } from "../project/project";

export type CharacterCell =
  | { kind: "empty" }
  | {
      kind: "sprite";
      spriteIndex: number;
    };

export interface CharacterSet {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: CharacterCell[];
}

export interface ExpandCharacterInput {
  baseX: number;
  baseY: number;
  sprites: SpriteTile[];
}

export interface BuildCharacterPreviewInput {
  sprites: SpriteTile[];
  palettes: NesSpritePalettes;
  transparentHex: string;
}

const EMPTY_CELL: CharacterCell = { kind: "empty" };

const isPositiveInteger = (value: number): boolean =>
  Number.isInteger(value) && value > 0;

const cellCount = (rows: number, cols: number): number => rows * cols;

const toCellIndex = (row: number, col: number, cols: number): number =>
  row * cols + col;

const normalizeCells = (
  rows: number,
  cols: number,
  cells: CharacterCell[],
): CharacterCell[] => {
  const expected = cellCount(rows, cols);
  return Array.from({ length: expected }, (_, index) => {
    const cellOption = O.fromNullable(cells[index]);
    return pipe(
      cellOption,
      O.getOrElse(() => EMPTY_CELL),
    );
  });
};

const toScreenSprite = (
  cell: Extract<CharacterCell, { kind: "sprite" }>,
  row: number,
  col: number,
  input: ExpandCharacterInput,
): E.Either<string, SpriteInScreen> => {
  const spriteTileOption = O.fromNullable(input.sprites[cell.spriteIndex]);
  if (O.isNone(spriteTileOption)) {
    return E.left(`sprite index out of range: ${cell.spriteIndex}`);
  }
  const spriteTile = spriteTileOption.value;

  return E.right({
    ...spriteTile,
    x: input.baseX + col * 8,
    y: input.baseY + row * 8,
    spriteIndex: cell.spriteIndex,
    priority: "front",
    flipH: false,
    flipV: false,
  });
};

export const createCharacterSet = (params: {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells?: CharacterCell[];
}): CharacterSet => {
  const safeRows = isPositiveInteger(params.rows) ? params.rows : 1;
  const safeCols = isPositiveInteger(params.cols) ? params.cols : 1;

  return {
    id: params.id,
    name: params.name,
    rows: safeRows,
    cols: safeCols,
    cells: normalizeCells(safeRows, safeCols, params.cells ?? []),
  };
};

export const resizeCharacterSet = (
  target: CharacterSet,
  nextRows: number,
  nextCols: number,
): CharacterSet => {
  const safeRows = isPositiveInteger(nextRows) ? nextRows : target.rows;
  const safeCols = isPositiveInteger(nextCols) ? nextCols : target.cols;

  const copiedCells = Array.from(
    { length: cellCount(safeRows, safeCols) },
    (_, nextIndex) => {
      const row = Math.floor(nextIndex / safeCols);
      const col = nextIndex % safeCols;
      const inOldBounds = row < target.rows && col < target.cols;

      if (inOldBounds === false) {
        return EMPTY_CELL;
      }

      const oldIndex = toCellIndex(row, col, target.cols);
      const oldCellOption = O.fromNullable(target.cells[oldIndex]);
      return pipe(
        oldCellOption,
        O.getOrElse(() => EMPTY_CELL),
      );
    },
  );

  return {
    ...target,
    rows: safeRows,
    cols: safeCols,
    cells: copiedCells,
  };
};

export const setCharacterCell = (
  target: CharacterSet,
  index: number,
  nextCell: CharacterCell,
): E.Either<string, CharacterSet> => {
  const isValidIndex =
    Number.isInteger(index) && index >= 0 && index < target.cells.length;
  if (isValidIndex === false) {
    return E.left(`cell index out of range: ${index}`);
  }

  return E.right({
    ...target,
    cells: target.cells.map((cell, cellIndex) =>
      cellIndex === index ? nextCell : cell,
    ),
  });
};

export const expandCharacterToScreenSprites = (
  target: CharacterSet,
  input: ExpandCharacterInput,
): E.Either<string, SpriteInScreen[]> => {
  const seed: E.Either<string, SpriteInScreen[]> = E.right([]);

  return target.cells.reduce((acc, cell, index) => {
    if (E.isLeft(acc)) {
      return acc;
    }

    if (cell.kind === "empty") {
      return acc;
    }

    const row = Math.floor(index / target.cols);
    const col = index % target.cols;
    const nextSprite = toScreenSprite(cell, row, col, input);
    if (E.isLeft(nextSprite)) {
      return E.left(nextSprite.left);
    }

    return E.right([...acc.right, nextSprite.right]);
  }, seed);
};

interface PreviewPlacement {
  row: number;
  col: number;
  tile: SpriteTile;
  hexPixels: string[][];
}

export const buildCharacterPreviewHexGrid = (
  target: CharacterSet,
  input: BuildCharacterPreviewInput,
): E.Either<string, string[][]> => {
  const placements = target.cells.reduce(
    (acc: E.Either<string, PreviewPlacement[]>, cell, index) => {
      if (E.isLeft(acc)) {
        return acc;
      }

      if (cell.kind === "empty") {
        return acc;
      }

      const tileOption = O.fromNullable(input.sprites[cell.spriteIndex]);
      if (O.isNone(tileOption)) {
        return E.left(`sprite index out of range: ${cell.spriteIndex}`);
      }
      const tile = tileOption.value;

      const row = Math.floor(index / target.cols);
      const col = index % target.cols;
      const hexPixels = renderSpriteTileToHexArray(tile, input.palettes);
      const nextPlacement: PreviewPlacement = {
        row,
        col,
        tile,
        hexPixels,
      };

      return E.right([...acc.right, nextPlacement]);
    },
    E.right<string, PreviewPlacement[]>([]),
  );

  if (E.isLeft(placements)) {
    return placements;
  }

  const width = target.cols * 8;
  const baseHeight = target.rows * 8;
  const height = placements.right.reduce(
    (acc, placement) =>
      Math.max(acc, placement.row * 8 + placement.tile.height),
    baseHeight,
  );

  const initGrid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => input.transparentHex),
  );

  const composedGrid = placements.right.reduce((grid, placement) => {
    const top = placement.row * 8;
    const left = placement.col * 8;

    return placement.tile.pixels.reduce((accRows, pixelRow, pixelY) => {
      return pixelRow.reduce((accPixels, colorIndex, pixelX) => {
        if (colorIndex === 0) {
          return accPixels;
        }

        const targetY = top + pixelY;
        const targetX = left + pixelX;
        const rowOption = O.fromNullable(placement.hexPixels[pixelY]);
        const colorOption = pipe(
          rowOption,
          O.chain((row) => O.fromNullable(row[pixelX])),
        );
        const nextHex = pipe(
          colorOption,
          O.getOrElse(() => input.transparentHex),
        );

        return accPixels.map((row, rowIndex) =>
          rowIndex === targetY
            ? row.map((hex, colIndex) => (colIndex === targetX ? nextHex : hex))
            : row,
        );
      }, accRows);
    }, grid);
  }, initGrid);

  return E.right(composedGrid);
};
