import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { type PaletteIndex } from "../project/project";
import {
  SCREEN_BACKGROUND_PALETTE_HEIGHT,
  SCREEN_BACKGROUND_PALETTE_WIDTH,
  type ScreenBackground,
} from "../project/projectV2";

const SCREEN_BACKGROUND_PALETTE_REGION_SIZE = 16;
const SCREEN_BACKGROUND_WIDTH_PIXELS =
  SCREEN_BACKGROUND_PALETTE_WIDTH * SCREEN_BACKGROUND_PALETTE_REGION_SIZE;
const SCREEN_BACKGROUND_HEIGHT_PIXELS =
  SCREEN_BACKGROUND_PALETTE_HEIGHT * SCREEN_BACKGROUND_PALETTE_REGION_SIZE;

interface ScreenBackgroundPaletteCoordinate {
  regionX: number;
  regionY: number;
}

interface ScreenBackgroundPalettePlacement extends ScreenBackgroundPaletteCoordinate {
  snappedPixelX: number;
  snappedPixelY: number;
  linearIndex: number;
}

const isPaletteIndex = (value: number): value is PaletteIndex =>
  value === 0 || value === 1 || value === 2 || value === 3;

const isValidScreenPixelCoordinate = (
  pixelX: number,
  pixelY: number,
): boolean =>
  Number.isFinite(pixelX) &&
  Number.isFinite(pixelY) &&
  pixelX >= 0 &&
  pixelX < SCREEN_BACKGROUND_WIDTH_PIXELS &&
  pixelY >= 0 &&
  pixelY < SCREEN_BACKGROUND_HEIGHT_PIXELS;

export const getScreenBackgroundPaletteLinearIndex = (
  regionX: number,
  regionY: number,
): E.Either<string, number> => {
  const isValidX =
    Number.isInteger(regionX) &&
    regionX >= 0 &&
    regionX < SCREEN_BACKGROUND_PALETTE_WIDTH;
  const isValidY =
    Number.isInteger(regionY) &&
    regionY >= 0 &&
    regionY < SCREEN_BACKGROUND_PALETTE_HEIGHT;

  if (isValidX === false || isValidY === false) {
    return E.left(
      `screen background palette coordinate out of range: (${regionX}, ${regionY})`,
    );
  }

  return E.right(regionY * SCREEN_BACKGROUND_PALETTE_WIDTH + regionX);
};

export const setScreenBackgroundPalette = (
  background: ScreenBackground,
  regionX: number,
  regionY: number,
  paletteIndex: PaletteIndex,
): E.Either<string, ScreenBackground> => {
  const linearIndex = getScreenBackgroundPaletteLinearIndex(regionX, regionY);

  if (isPaletteIndex(paletteIndex) === false) {
    return E.left(`invalid background palette index: ${paletteIndex}`);
  }

  if (E.isLeft(linearIndex)) {
    return linearIndex;
  }

  return E.right({
    ...background,
    paletteIndices: background.paletteIndices.map((value, index) =>
      index === linearIndex.right ? paletteIndex : value,
    ),
  });
};

export const resolveScreenBackgroundPaletteIndexAtTile = (
  background: ScreenBackground,
  tileX: number,
  tileY: number,
): E.Either<string, PaletteIndex> => {
  const regionX = Math.floor(tileX / 2);
  const regionY = Math.floor(tileY / 2);
  const linearIndex = getScreenBackgroundPaletteLinearIndex(regionX, regionY);

  if (E.isLeft(linearIndex)) {
    return linearIndex;
  }

  const paletteIndexOption = O.fromNullable(
    background.paletteIndices[linearIndex.right],
  );

  if (O.isNone(paletteIndexOption)) {
    return E.left("screen background palette index is missing");
  }

  return E.right(paletteIndexOption.value);
};

export const getScreenBackgroundPalettePlacementFromPixel = (
  pixelX: number,
  pixelY: number,
): E.Either<string, ScreenBackgroundPalettePlacement> => {
  if (isValidScreenPixelCoordinate(pixelX, pixelY) === false) {
    return E.left(
      `screen background palette pixel coordinate out of range: (${pixelX}, ${pixelY})`,
    );
  }

  const regionX = Math.floor(pixelX / SCREEN_BACKGROUND_PALETTE_REGION_SIZE);
  const regionY = Math.floor(pixelY / SCREEN_BACKGROUND_PALETTE_REGION_SIZE);
  const linearIndex = getScreenBackgroundPaletteLinearIndex(regionX, regionY);

  if (E.isLeft(linearIndex)) {
    return linearIndex;
  }

  return E.right({
    regionX,
    regionY,
    snappedPixelX: regionX * SCREEN_BACKGROUND_PALETTE_REGION_SIZE,
    snappedPixelY: regionY * SCREEN_BACKGROUND_PALETTE_REGION_SIZE,
    linearIndex: linearIndex.right,
  });
};

export const setScreenBackgroundPaletteAtPixel = (
  background: ScreenBackground,
  pixelX: number,
  pixelY: number,
  paletteIndex: PaletteIndex,
): E.Either<string, ScreenBackground> => {
  const placement = getScreenBackgroundPalettePlacementFromPixel(
    pixelX,
    pixelY,
  );

  if (E.isLeft(placement)) {
    return placement;
  }

  return setScreenBackgroundPalette(
    background,
    placement.right.regionX,
    placement.right.regionY,
    paletteIndex,
  );
};

export const resolveScreenBackgroundPaletteIndexAtPixel = (
  background: ScreenBackground,
  pixelX: number,
  pixelY: number,
): E.Either<string, PaletteIndex> => {
  const placement = getScreenBackgroundPalettePlacementFromPixel(
    pixelX,
    pixelY,
  );

  if (E.isLeft(placement)) {
    return placement;
  }

  const paletteIndexOption = O.fromNullable(
    background.paletteIndices[placement.right.linearIndex],
  );

  if (O.isNone(paletteIndexOption)) {
    return E.left("screen background palette index is missing");
  }

  return E.right(paletteIndexOption.value);
};

export const paintScreenBackgroundPalettes = (
  background: ScreenBackground,
  cells: ReadonlyArray<ScreenBackgroundPaletteCoordinate>,
  paletteIndex: PaletteIndex,
): E.Either<string, ScreenBackground> =>
  cells.reduce<E.Either<string, ScreenBackground>>(
    (result, cell) =>
      E.isLeft(result)
        ? result
        : setScreenBackgroundPalette(
            result.right,
            cell.regionX,
            cell.regionY,
            paletteIndex,
          ),
    E.right(background),
  );
