import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { CharacterSprite } from "../../domain/characters/characterSet";

export interface CharacterLayerEntry {
  index: number;
  sprite: CharacterSprite;
}

export interface ResolveCharacterStagePointInput {
  clientX: number;
  clientY: number;
  stageLeft: number;
  stageTop: number;
  stageScale: number;
  offsetX: number;
  offsetY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type CharacterSpriteNudgeDirection = "left" | "right" | "up" | "down";

interface OrderedCharacterLayerEntry extends CharacterLayerEntry {
  layer: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const shouldComeBefore = (
  next: OrderedCharacterLayerEntry,
  current: OrderedCharacterLayerEntry,
): boolean => {
  if (next.layer !== current.layer) {
    return next.layer < current.layer;
  }

  return next.index < current.index;
};

const insertOrdered = (
  items: OrderedCharacterLayerEntry[],
  next: OrderedCharacterLayerEntry,
): OrderedCharacterLayerEntry[] => {
  const insertIndex = items.findIndex((current) =>
    shouldComeBefore(next, current),
  );

  if (insertIndex < 0) {
    return [...items, next];
  }

  return [...items.slice(0, insertIndex), next, ...items.slice(insertIndex)];
};

export const getCharacterLayerEntries = (
  sprites: CharacterSprite[],
): CharacterLayerEntry[] => {
  const ordered = sprites.reduce<OrderedCharacterLayerEntry[]>(
    (entries, sprite, index) =>
      insertOrdered(entries, {
        index,
        sprite,
        layer: sprite.layer,
      }),
    [],
  );

  return ordered.reduceRight<CharacterLayerEntry[]>(
    (entries, entry) => [...entries, { index: entry.index, sprite: entry.sprite }],
    [],
  );
};

export const getNextCharacterSpriteLayer = (
  sprites: CharacterSprite[],
): number =>
  clamp(
    sprites.reduce(
      (highestLayer, sprite) => Math.max(highestLayer, sprite.layer),
      -1,
    ) + 1,
    0,
    63,
  );

export const ensureSelectedCharacterSpriteIndex = (
  selectedIndex: O.Option<number>,
  spriteCount: number,
): O.Option<number> =>
  pipe(
    selectedIndex,
    O.filter(
      (index) => Number.isInteger(index) && index >= 0 && index < spriteCount,
    ),
  );

export const resolveSelectionAfterSpriteRemoval = (
  selectedIndex: O.Option<number>,
  removedIndex: number,
  nextSpriteCount: number,
): O.Option<number> =>
  pipe(
    selectedIndex,
    O.chain((index) => {
      if (nextSpriteCount <= 0) {
        return O.none;
      }

      if (index === removedIndex) {
        return O.some(Math.min(removedIndex, nextSpriteCount - 1));
      }

      if (index > removedIndex) {
        return O.some(index - 1);
      }

      if (index < nextSpriteCount) {
        return O.some(index);
      }

      return O.some(nextSpriteCount - 1);
    }),
  );

export const resolveCharacterStagePoint = (
  input: ResolveCharacterStagePointInput,
): { x: number; y: number } => ({
  x: clamp(
    Math.round(
      (input.clientX - input.stageLeft - input.offsetX) / input.stageScale,
    ),
    input.minX,
    input.maxX,
  ),
  y: clamp(
    Math.round(
      (input.clientY - input.stageTop - input.offsetY) / input.stageScale,
    ),
    input.minY,
    input.maxY,
  ),
});

export const nudgeCharacterSprite = (
  sprite: CharacterSprite,
  direction: CharacterSpriteNudgeDirection,
  maxX: number,
  maxY: number,
): CharacterSprite => {
  const nextX = (() => {
    if (direction === "left") {
      return clamp(sprite.x - 1, 0, maxX);
    }

    if (direction === "right") {
      return clamp(sprite.x + 1, 0, maxX);
    }

    return sprite.x;
  })();

  const nextY = (() => {
    if (direction === "up") {
      return clamp(sprite.y - 1, 0, maxY);
    }

    if (direction === "down") {
      return clamp(sprite.y + 1, 0, maxY);
    }

    return sprite.y;
  })();

  return {
    ...sprite,
    x: nextX,
    y: nextY,
  };
};

export const shiftCharacterSpriteLayer = (
  sprite: CharacterSprite,
  amount: number,
): CharacterSprite => ({
  ...sprite,
  layer: clamp(sprite.layer + amount, 0, 63),
});
