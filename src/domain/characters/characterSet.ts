import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { NesSpritePalettes } from "../nes/nesProject";
import { renderSpriteTileToHexArray } from "../nes/rendering";
import { SpriteInScreen, SpriteTile } from "../project/project";

export interface CharacterSprite {
  spriteIndex: number;
  x: number;
  y: number;
  layer: number;
}

export interface CharacterSpriteInput {
  spriteIndex: number;
  x?: number;
  y?: number;
  layer?: number;
}

export interface CharacterSet {
  id: string;
  name: string;
  sprites: CharacterSprite[];
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

interface OrderedSpritePlacement {
  index: number;
  layer: number;
}

interface PositionedScreenSprite extends OrderedSpritePlacement {
  sprite: SpriteInScreen;
}

interface PreviewPlacement extends OrderedSpritePlacement {
  x: number;
  y: number;
  tile: SpriteTile;
  hexPixels: string[][];
}

const normalizeNonNegativeInt = (value: O.Option<number>): number =>
  pipe(
    value,
    O.filter((n) => Number.isInteger(n) && n >= 0),
    O.getOrElse(() => 0),
  );

const normalizeSprite = (sprite: CharacterSpriteInput): CharacterSprite => ({
  spriteIndex: normalizeNonNegativeInt(O.some(sprite.spriteIndex)),
  x: normalizeNonNegativeInt(O.fromNullable(sprite.x)),
  y: normalizeNonNegativeInt(O.fromNullable(sprite.y)),
  layer: normalizeNonNegativeInt(O.fromNullable(sprite.layer)),
});

const shouldComeBefore = (
  next: OrderedSpritePlacement,
  current: OrderedSpritePlacement,
): boolean => {
  if (next.layer !== current.layer) {
    return next.layer < current.layer;
  }

  return next.index < current.index;
};

const insertOrdered = <T extends OrderedSpritePlacement>(
  items: T[],
  next: T,
): T[] => {
  const insertIndex = items.findIndex((current) =>
    shouldComeBefore(next, current),
  );

  if (insertIndex < 0) {
    return [...items, next];
  }

  return [...items.slice(0, insertIndex), next, ...items.slice(insertIndex)];
};

const toScreenSprite = (
  sprite: CharacterSprite,
  index: number,
  input: ExpandCharacterInput,
): E.Either<string, PositionedScreenSprite> => {
  const spriteTileOption = O.fromNullable(input.sprites[sprite.spriteIndex]);
  if (O.isNone(spriteTileOption)) {
    return E.left(`sprite index out of range: ${sprite.spriteIndex}`);
  }

  return E.right({
    index,
    layer: sprite.layer,
    sprite: {
      ...spriteTileOption.value,
      x: input.baseX + sprite.x,
      y: input.baseY + sprite.y,
      spriteIndex: sprite.spriteIndex,
      priority: "front",
      flipH: false,
      flipV: false,
    },
  });
};

export const createCharacterSet = (params: {
  id: string;
  name: string;
  sprites?: CharacterSpriteInput[];
}): CharacterSet => ({
  id: params.id,
  name: params.name,
  sprites: (params.sprites ?? []).map(normalizeSprite),
});

export const addCharacterSprite = (
  target: CharacterSet,
  sprite: CharacterSpriteInput,
): CharacterSet => ({
  ...target,
  sprites: [...target.sprites, normalizeSprite(sprite)],
});

export const setCharacterSprite = (
  target: CharacterSet,
  index: number,
  nextSprite: CharacterSpriteInput,
): E.Either<string, CharacterSet> => {
  const isValidIndex =
    Number.isInteger(index) && index >= 0 && index < target.sprites.length;
  if (isValidIndex === false) {
    return E.left(`sprite index out of range: ${index}`);
  }

  return E.right({
    ...target,
    sprites: target.sprites.map((sprite, spriteIndex) =>
      spriteIndex === index ? normalizeSprite(nextSprite) : sprite,
    ),
  });
};

export const removeCharacterSprite = (
  target: CharacterSet,
  index: number,
): E.Either<string, CharacterSet> => {
  const isValidIndex =
    Number.isInteger(index) && index >= 0 && index < target.sprites.length;
  if (isValidIndex === false) {
    return E.left(`sprite index out of range: ${index}`);
  }

  return E.right({
    ...target,
    sprites: target.sprites.filter((_, spriteIndex) => spriteIndex !== index),
  });
};

export const expandCharacterToScreenSprites = (
  target: CharacterSet,
  input: ExpandCharacterInput,
): E.Either<string, SpriteInScreen[]> => {
  const seed: E.Either<string, PositionedScreenSprite[]> = E.right([]);

  const expanded = target.sprites.reduce((acc, sprite, index) => {
    if (E.isLeft(acc)) {
      return acc;
    }

    const positioned = toScreenSprite(sprite, index, input);
    if (E.isLeft(positioned)) {
      return E.left(positioned.left);
    }

    return E.right([...acc.right, positioned.right]);
  }, seed);

  if (E.isLeft(expanded)) {
    return expanded;
  }

  const emptyOrdered: PositionedScreenSprite[] = [];
  const ordered = expanded.right.reduce(
    (acc, sprite) => insertOrdered(acc, sprite),
    emptyOrdered,
  );

  return E.right(ordered.map((item) => item.sprite));
};

export const buildCharacterPreviewHexGrid = (
  target: CharacterSet,
  input: BuildCharacterPreviewInput,
): E.Either<string, string[][]> => {
  const seed: E.Either<string, PreviewPlacement[]> = E.right([]);

  const placements = target.sprites.reduce((acc, sprite, index) => {
    if (E.isLeft(acc)) {
      return acc;
    }

    const tileOption = O.fromNullable(input.sprites[sprite.spriteIndex]);
    if (O.isNone(tileOption)) {
      return E.left(`sprite index out of range: ${sprite.spriteIndex}`);
    }

    const nextPlacement: PreviewPlacement = {
      index,
      layer: sprite.layer,
      x: sprite.x,
      y: sprite.y,
      tile: tileOption.value,
      hexPixels: renderSpriteTileToHexArray(tileOption.value, input.palettes),
    };

    return E.right([...acc.right, nextPlacement]);
  }, seed);

  if (E.isLeft(placements)) {
    return placements;
  }

  const emptyPlacements: PreviewPlacement[] = [];
  const ordered = placements.right.reduce(
    (acc, placement) => insertOrdered(acc, placement),
    emptyPlacements,
  );

  const width = ordered.reduce(
    (acc, placement) => Math.max(acc, placement.x + placement.tile.width),
    8,
  );
  const height = ordered.reduce(
    (acc, placement) => Math.max(acc, placement.y + placement.tile.height),
    8,
  );

  const initGrid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => input.transparentHex),
  );

  const composed = ordered.reduceRight((grid, placement) => {
    return placement.tile.pixels.reduce((accRows, pixelRow, pixelY) => {
      return pixelRow.reduce((accPixels, colorIndex, pixelX) => {
        if (colorIndex === 0) {
          return accPixels;
        }

        const targetY = placement.y + pixelY;
        const targetX = placement.x + pixelX;
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

  return E.right(composed);
};
