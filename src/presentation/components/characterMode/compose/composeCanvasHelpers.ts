import { type CanvasEvents, type FabricObject } from "fabric";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { type SpriteTile } from "../../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../../domain/nes/nesProject";
import { renderSpriteTileToHexArray } from "../../../../domain/nes/rendering";
import { type FabricSpriteObjectEntry } from "../types/characterModeInteractionState";

export const createComposeSpriteSource = (
  spriteIndex: number,
  sprites: SpriteTile[],
  spritePalettes: NesSpritePalettes,
): O.Option<HTMLCanvasElement> => {
  if (typeof document === "undefined") {
    return O.none;
  }

  const tileOption = O.fromNullable(sprites[spriteIndex]);
  if (O.isNone(tileOption)) {
    return O.none;
  }

  const tile = tileOption.value;
  const sourceCanvas = Object.assign(document.createElement("canvas"), {
    width: tile.width,
    height: tile.height,
  });
  const contextOption = O.fromNullable(sourceCanvas.getContext("2d"));
  if (O.isNone(contextOption)) {
    return O.none;
  }

  const context = contextOption.value;
  const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);
  context.clearRect(0, 0, tile.width, tile.height);

  tile.pixels.forEach((pixelRow, rowIndex) => {
    pixelRow.forEach((colorIndex, columnIndex) => {
      if (colorIndex === 0) {
        return;
      }

      const colorHexOption = pipe(
        O.fromNullable(hexPixels[rowIndex]),
        O.chain((hexRow) => O.fromNullable(hexRow[columnIndex])),
      );

      if (O.isNone(colorHexOption)) {
        return;
      }

      Object.assign(context, {
        fillStyle: colorHexOption.value,
      });
      context.fillRect(columnIndex, rowIndex, 1, 1);
    });
  });

  return O.some(sourceCanvas);
};

export const findComposeObjectEntry = (
  entries: ReadonlyArray<FabricSpriteObjectEntry>,
  target?: FabricObject,
): O.Option<FabricSpriteObjectEntry> =>
  pipe(
    O.fromNullable(target),
    O.chain((currentTarget) =>
      O.fromNullable(entries.find((entry) => entry.object === currentTarget)),
    ),
  );

export const isMouseLikeCanvasEvent = (
  event: CanvasEvents["mouse:down"]["e"],
): event is MouseEvent | PointerEvent =>
  "button" in event && "clientX" in event && "clientY" in event;

export const isSameOptionalNumber = (
  left: O.Option<number>,
  right: O.Option<number>,
): boolean =>
  pipe(
    left,
    O.match(
      () => O.isNone(right),
      (leftValue) =>
        pipe(
          right,
          O.match(
            () => false,
            (rightValue) => rightValue === leftValue,
          ),
        ),
    ),
  );
