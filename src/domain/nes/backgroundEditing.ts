import * as E from "fp-ts/Either";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
} from "../project/project";
import { type BackgroundTile } from "../project/projectV2";
import { decodeBackgroundTile, encodeBackgroundTile } from "./chr";
import {
  getAttributeByteIndex,
  getNameTableLinearIndex,
  type NesAttributeTable,
  type NesNameTable,
} from "./nesProject";

const CHR_BYTES_PER_TILE = 16;
const BACKGROUND_TILE_SIZE = 8;
const MAX_BACKGROUND_TILE_INDEX = 255;

const isValidBackgroundTileIndex = (tileIndex: number): boolean =>
  Number.isInteger(tileIndex) &&
  tileIndex >= 0 &&
  tileIndex <= MAX_BACKGROUND_TILE_INDEX;

const isValidTilePixelCoordinate = (coordinate: number): boolean =>
  Number.isInteger(coordinate) &&
  coordinate >= 0 &&
  coordinate < BACKGROUND_TILE_SIZE;

const isValidPaletteIndex = (
  paletteIndex: number,
): paletteIndex is PaletteIndex =>
  paletteIndex === 0 ||
  paletteIndex === 1 ||
  paletteIndex === 2 ||
  paletteIndex === 3;

const resolveChrSliceStart = (tileIndex: number): E.Either<string, number> => {
  if (isValidBackgroundTileIndex(tileIndex) === false) {
    return E.left(`background tile index out of range: ${tileIndex}`);
  }

  return E.right(tileIndex * CHR_BYTES_PER_TILE);
};

const replaceTilePixel = (
  tile: BackgroundTile,
  pixelX: number,
  pixelY: number,
  nextColorIndex: ColorIndexOfPalette,
): BackgroundTile => ({
  ...tile,
  pixels: tile.pixels.map((row, rowIndex) =>
    rowIndex === pixelY
      ? row.map((value, columnIndex) =>
          columnIndex === pixelX ? nextColorIndex : value,
        )
      : row,
  ),
});

export const decodeBackgroundTileAtIndex = (
  chrBytes: ReadonlyArray<number>,
  tileIndex: number,
): E.Either<string, BackgroundTile> => {
  const chrSliceStart = resolveChrSliceStart(tileIndex);

  if (E.isLeft(chrSliceStart)) {
    return chrSliceStart;
  }

  return decodeBackgroundTile(
    chrBytes.slice(
      chrSliceStart.right,
      chrSliceStart.right + CHR_BYTES_PER_TILE,
    ),
  );
};

export const replaceBackgroundTileAtIndex = (
  chrBytes: ReadonlyArray<number>,
  tileIndex: number,
  tile: BackgroundTile,
): E.Either<string, number[]> => {
  const chrSliceStart = resolveChrSliceStart(tileIndex);

  if (E.isLeft(chrSliceStart)) {
    return chrSliceStart;
  }

  const encodedTile = Array.from(encodeBackgroundTile(tile));

  return E.right(
    chrBytes.map((value, index) => {
      const tileByteOffset = index - chrSliceStart.right;
      const replacementByte = encodedTile[tileByteOffset];

      return tileByteOffset >= 0 && tileByteOffset < CHR_BYTES_PER_TILE
        ? (replacementByte ?? value)
        : value;
    }),
  );
};

export const replaceBackgroundTilePixel = (
  chrBytes: ReadonlyArray<number>,
  tileIndex: number,
  pixelX: number,
  pixelY: number,
  nextColorIndex: ColorIndexOfPalette,
): E.Either<string, number[]> => {
  const hasValidCoordinates =
    isValidTilePixelCoordinate(pixelX) && isValidTilePixelCoordinate(pixelY);

  if (hasValidCoordinates === false) {
    return E.left(`background tile pixel out of range: (${pixelX}, ${pixelY})`);
  }

  return E.chain((tile: BackgroundTile) =>
    replaceBackgroundTileAtIndex(
      chrBytes,
      tileIndex,
      replaceTilePixel(tile, pixelX, pixelY, nextColorIndex),
    ),
  )(decodeBackgroundTileAtIndex(chrBytes, tileIndex));
};

export const setNameTableTileAtPixel = (
  nameTable: NesNameTable,
  pixelX: number,
  pixelY: number,
  tileIndex: number,
): E.Either<string, NesNameTable> => {
  if (isValidBackgroundTileIndex(tileIndex) === false) {
    return E.left(`background tile index out of range: ${tileIndex}`);
  }

  const nameTableIndex = getNameTableLinearIndex(
    Math.floor(pixelX / BACKGROUND_TILE_SIZE),
    Math.floor(pixelY / BACKGROUND_TILE_SIZE),
  );

  if (E.isLeft(nameTableIndex)) {
    return nameTableIndex;
  }

  return E.right({
    ...nameTable,
    tileIndices: nameTable.tileIndices.map((value, index) =>
      index === nameTableIndex.right ? tileIndex : value,
    ),
  });
};

export const setAttributeTablePaletteAtPixel = (
  attributeTable: NesAttributeTable,
  pixelX: number,
  pixelY: number,
  paletteIndex: PaletteIndex,
): E.Either<string, NesAttributeTable> => {
  if (isValidPaletteIndex(paletteIndex) === false) {
    return E.left(`invalid background palette index: ${paletteIndex}`);
  }

  const tileX = Math.floor(pixelX / BACKGROUND_TILE_SIZE);
  const tileY = Math.floor(pixelY / BACKGROUND_TILE_SIZE);
  const attributeByteIndex = getAttributeByteIndex(tileX, tileY);

  if (E.isLeft(attributeByteIndex)) {
    return attributeByteIndex;
  }

  const isRightHalf = tileX % 4 >= 2;
  const isBottomHalf = tileY % 4 >= 2;
  const shift =
    (isRightHalf === true ? 2 : 0) + (isBottomHalf === true ? 4 : 0);
  const clearedMask = ~(0b11 << shift);

  return E.right({
    ...attributeTable,
    bytes: attributeTable.bytes.map((value, index) =>
      index === attributeByteIndex.right
        ? (value & clearedMask) | (paletteIndex << shift)
        : value,
    ),
  });
};
