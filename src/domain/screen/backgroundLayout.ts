import * as E from "fp-ts/Either";
import {
  SCREEN_BACKGROUND_HEIGHT_TILES,
  SCREEN_BACKGROUND_WIDTH_TILES,
  type ScreenBackground,
} from "../project/projectV2";

export const getScreenBackgroundTileLinearIndex = (
  tileX: number,
  tileY: number,
): E.Either<string, number> => {
  const isValidX =
    Number.isInteger(tileX) &&
    tileX >= 0 &&
    tileX < SCREEN_BACKGROUND_WIDTH_TILES;
  const isValidY =
    Number.isInteger(tileY) &&
    tileY >= 0 &&
    tileY < SCREEN_BACKGROUND_HEIGHT_TILES;

  if (isValidX === false || isValidY === false) {
    return E.left(
      `screen background tile coordinate out of range: (${tileX}, ${tileY})`,
    );
  }

  return E.right(tileY * SCREEN_BACKGROUND_WIDTH_TILES + tileX);
};

export const setScreenBackgroundTile = (
  background: ScreenBackground,
  tileX: number,
  tileY: number,
  nextTileIndex: number,
): E.Either<string, ScreenBackground> => {
  const linearIndex = getScreenBackgroundTileLinearIndex(tileX, tileY);
  const isValidTileIndex =
    Number.isInteger(nextTileIndex) && nextTileIndex >= 0;

  if (isValidTileIndex === false) {
    return E.left(`invalid background tile index: ${nextTileIndex}`);
  }

  if (E.isLeft(linearIndex)) {
    return linearIndex;
  }

  return E.right({
    ...background,
    tileIndices: background.tileIndices.map((tileIndex, index) =>
      index === linearIndex.right ? nextTileIndex : tileIndex,
    ),
  });
};
