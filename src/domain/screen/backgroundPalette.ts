import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { type PaletteIndex } from "../project/project";
import {
  SCREEN_BACKGROUND_PALETTE_HEIGHT,
  SCREEN_BACKGROUND_PALETTE_WIDTH,
  type ScreenBackground,
} from "../project/projectV2";

const isPaletteIndex = (value: number): value is PaletteIndex =>
  value === 0 || value === 1 || value === 2 || value === 3;

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
