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

interface CharacterSpriteInput {
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

interface ExpandCharacterInput {
  baseX: number;
  baseY: number;
  sprites: SpriteTile[];
}

interface BuildCharacterPreviewInput {
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

const resolvePlacementHex = (
  placement: PreviewPlacement,
  pixelY: number,
  pixelX: number,
  transparentHex: string,
): string =>
  pipe(
    O.fromNullable(placement.hexPixels[pixelY]),
    O.chain((row) => O.fromNullable(row[pixelX])),
    O.getOrElse(() => transparentHex),
  );

const composePlacementOnGrid = (
  grid: string[][],
  placement: PreviewPlacement,
  transparentHex: string,
): string[][] => {
  placement.tile.pixels.forEach((pixelRow, pixelY) => {
    pixelRow.forEach((colorIndex, pixelX) => {
      if (colorIndex === 0) {
        return;
      }

      const targetY = placement.y + pixelY;
      const targetX = placement.x + pixelX;
      const rowOption = O.fromNullable(grid[targetY]);
      if (O.isNone(rowOption)) {
        return;
      }

      const cellOption = O.fromNullable(rowOption.value[targetX]);
      if (O.isNone(cellOption)) {
        return;
      }

      const nextHex = resolvePlacementHex(
        placement,
        pixelY,
        pixelX,
        transparentHex,
      );

      // eslint-disable-next-line functional/immutable-data -- mutate only this locally allocated output grid to avoid per-pixel full-array cloning; function inputs and external state remain immutable.
      rowOption.value[targetX] = nextHex;
    });
  });

  return grid;
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

/**
 * 入力値を正規化しながら新しいキャラクターセットを生成します。
 * スプライト座標やレイヤーの初期不整合を入口で吸収し、以後の編集処理を単純化する意図があります。
 */
export const createCharacterSet = (params: {
  id: string;
  name: string;
  sprites?: CharacterSpriteInput[];
}): CharacterSet => ({
  id: params.id,
  name: params.name,
  sprites: (params.sprites ?? []).map(normalizeSprite),
});

/**
 * キャラクターセットに 1 枚の構成スプライトを追加します。
 * 追加時にも座標やレイヤーを正規化し、状態更新を不変に保つことを意図しています。
 */
export const addCharacterSprite = (
  target: CharacterSet,
  sprite: CharacterSpriteInput,
): CharacterSet => ({
  ...target,
  sprites: [...target.sprites, normalizeSprite(sprite)],
});

/**
 * キャラクターセット内の指定スプライトを置き換えます。
 * 範囲外アクセスを `Either` で明示しつつ、正常系では正規化済みの値へ安全に更新します。
 */
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

/**
 * キャラクターセットから指定スプライトを削除します。
 * 不正な index を失敗として返し、削除後の配列だけを新しく組み立てて返します。
 */
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

/**
 * キャラクターセットをスクリーン配置用のスプライト列へ展開します。
 * 各構成要素に基準座標を足し、レイヤー順を保ったまま描画順の配列へ変換するための関数です。
 */
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

/**
 * キャラクターセットのプレビュー用 2D 色グリッドを合成します。
 * レイヤー順にスプライトを重ね、透明色を保ちながら UI 表示用の最終ピクセル列を作ります。
 */
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

  const composed = ordered.reduceRight(
    (grid, placement) =>
      composePlacementOnGrid(grid, placement, input.transparentHex),
    initGrid,
  );

  return E.right(composed);
};
