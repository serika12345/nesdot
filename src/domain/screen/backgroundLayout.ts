import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import {
  SCREEN_BACKGROUND_HEIGHT_TILES,
  SCREEN_BACKGROUND_WIDTH_TILES,
  type ScreenBackground,
} from "../project/projectV2";

const SCREEN_BACKGROUND_TILE_SIZE = 8;
const SCREEN_BACKGROUND_WIDTH_PIXELS =
  SCREEN_BACKGROUND_WIDTH_TILES * SCREEN_BACKGROUND_TILE_SIZE;
const SCREEN_BACKGROUND_HEIGHT_PIXELS =
  SCREEN_BACKGROUND_HEIGHT_TILES * SCREEN_BACKGROUND_TILE_SIZE;

interface ScreenBackgroundTileCoordinate {
  tileX: number;
  tileY: number;
}

interface ScreenBackgroundTilePlacement extends ScreenBackgroundTileCoordinate {
  snappedPixelX: number;
  snappedPixelY: number;
  linearIndex: number;
}

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

export const getScreenBackgroundTilePlacementFromPixel = (
  pixelX: number,
  pixelY: number,
): E.Either<string, ScreenBackgroundTilePlacement> => {
  if (isValidScreenPixelCoordinate(pixelX, pixelY) === false) {
    return E.left(
      `screen background pixel coordinate out of range: (${pixelX}, ${pixelY})`,
    );
  }

  const tileX = Math.floor(pixelX / SCREEN_BACKGROUND_TILE_SIZE);
  const tileY = Math.floor(pixelY / SCREEN_BACKGROUND_TILE_SIZE);
  const linearIndex = getScreenBackgroundTileLinearIndex(tileX, tileY);

  if (E.isLeft(linearIndex)) {
    return linearIndex;
  }

  return E.right({
    tileX,
    tileY,
    snappedPixelX: tileX * SCREEN_BACKGROUND_TILE_SIZE,
    snappedPixelY: tileY * SCREEN_BACKGROUND_TILE_SIZE,
    linearIndex: linearIndex.right,
  });
};

export const placeScreenBackgroundTileAtPixel = (
  background: ScreenBackground,
  pixelX: number,
  pixelY: number,
  nextTileIndex: number,
): E.Either<string, ScreenBackground> => {
  const placement = getScreenBackgroundTilePlacementFromPixel(pixelX, pixelY);

  if (E.isLeft(placement)) {
    return placement;
  }

  return setScreenBackgroundTile(
    background,
    placement.right.tileX,
    placement.right.tileY,
    nextTileIndex,
  );
};

export const resolveScreenBackgroundTileIndexAtPixel = (
  background: ScreenBackground,
  pixelX: number,
  pixelY: number,
): E.Either<string, number> => {
  const placement = getScreenBackgroundTilePlacementFromPixel(pixelX, pixelY);

  if (E.isLeft(placement)) {
    return placement;
  }

  const tileIndexOption = O.fromNullable(
    background.tileIndices[placement.right.linearIndex],
  );

  return O.isNone(tileIndexOption)
    ? E.left("screen background tile index is missing")
    : E.right(tileIndexOption.value);
};

export const paintScreenBackgroundTiles = (
  background: ScreenBackground,
  cells: ReadonlyArray<ScreenBackgroundTileCoordinate>,
  nextTileIndex: number,
): E.Either<string, ScreenBackground> =>
  cells.reduce<E.Either<string, ScreenBackground>>(
    (result, cell) =>
      E.isLeft(result)
        ? result
        : setScreenBackgroundTile(
            result.right,
            cell.tileX,
            cell.tileY,
            nextTileIndex,
          ),
    E.right(background),
  );
