import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
} from "../project/project";
import { type BackgroundTile } from "../project/projectV2";
import { decodeBackgroundTile } from "./chr";
import {
  getAttributeByteIndex,
  getNameTableLinearIndex,
  type NesAttributeTable,
  type NesNameTable,
} from "./nesProject";

const CHR_BYTES_PER_TILE = 16;
const BACKGROUND_TILE_SIZE = 8;
const MAX_BACKGROUND_TILE_INDEX = 255;

export interface BackgroundTilePixelWrite {
  nextColorIndex: ColorIndexOfPalette;
  pixelX: number;
  pixelY: number;
}

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

const updateBitPlaneByte = (
  byte: number,
  shift: number,
  bitValue: 0 | 1,
): number => {
  const bitMask = 1 << shift;

  return bitValue === 1 ? byte | bitMask : byte & ~bitMask;
};

const toBitValue = (value: number): 0 | 1 => (value === 0 ? 0 : 1);

const resolveChrSliceStart = (tileIndex: number): E.Either<string, number> => {
  if (isValidBackgroundTileIndex(tileIndex) === false) {
    return E.left(`background tile index out of range: ${tileIndex}`);
  }

  return E.right(tileIndex * CHR_BYTES_PER_TILE);
};

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

  const chrSliceStart = resolveChrSliceStart(tileIndex);

  if (E.isLeft(chrSliceStart)) {
    return chrSliceStart;
  }

  const plane0Index = chrSliceStart.right + pixelY;
  const plane1Index = chrSliceStart.right + 8 + pixelY;
  const shift = 7 - pixelX;
  const plane0 = chrBytes[plane0Index] ?? 0;
  const plane1 = chrBytes[plane1Index] ?? 0;
  const nextPlane0 = updateBitPlaneByte(
    plane0,
    shift,
    toBitValue(nextColorIndex & 1),
  );
  const nextPlane1 = updateBitPlaneByte(
    plane1,
    shift,
    toBitValue((nextColorIndex >> 1) & 1),
  );
  const nextChrBytes = Array.from(chrBytes);

  // eslint-disable-next-line functional/immutable-data -- performance hot path: mutate only the newly allocated CHR buffer so pointer painting does not remap all 4096 bytes on every move.
  nextChrBytes[plane0Index] = nextPlane0;
  // eslint-disable-next-line functional/immutable-data -- performance hot path: mutate only the newly allocated CHR buffer so pointer painting does not remap all 4096 bytes on every move.
  nextChrBytes[plane1Index] = nextPlane1;

  return E.right(nextChrBytes);
};

const applyBackgroundTilePixelWriteToByte = (
  byte: number,
  byteIndex: number,
  chrSliceStart: number,
  write: BackgroundTilePixelWrite,
): number => {
  const plane0Index = chrSliceStart + write.pixelY;
  const plane1Index = chrSliceStart + 8 + write.pixelY;
  const shift = 7 - write.pixelX;

  if (byteIndex === plane0Index) {
    return updateBitPlaneByte(
      byte,
      shift,
      toBitValue(write.nextColorIndex & 1),
    );
  }

  if (byteIndex === plane1Index) {
    return updateBitPlaneByte(
      byte,
      shift,
      toBitValue((write.nextColorIndex >> 1) & 1),
    );
  }

  return byte;
};

export const replaceBackgroundTilePixels = (
  chrBytes: ReadonlyArray<number>,
  tileIndex: number,
  writes: ReadonlyArray<BackgroundTilePixelWrite>,
): E.Either<string, number[]> => {
  const chrSliceStart = resolveChrSliceStart(tileIndex);

  if (E.isLeft(chrSliceStart)) {
    return chrSliceStart;
  }

  const invalidWrite = O.fromNullable(
    writes.find(
      (write) =>
        isValidTilePixelCoordinate(write.pixelX) === false ||
        isValidTilePixelCoordinate(write.pixelY) === false,
    ),
  );

  if (O.isSome(invalidWrite)) {
    return E.left(
      `background tile pixel out of range: (${invalidWrite.value.pixelX}, ${invalidWrite.value.pixelY})`,
    );
  }

  return E.right(
    chrBytes.map((byte, byteIndex) =>
      writes.reduce(
        (currentByte, write) =>
          applyBackgroundTilePixelWriteToByte(
            currentByte,
            byteIndex,
            chrSliceStart.right,
            write,
          ),
        byte,
      ),
    ),
  );
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
