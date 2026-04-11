import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { CharacterSprite } from "../../../../../domain/characters/characterSet";

interface CharacterLayerEntry {
  index: number;
  sprite: CharacterSprite;
}

interface ResolveCharacterStagePointInput {
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

type CharacterSpriteNudgeDirection = "left" | "right" | "up" | "down";

interface OrderedCharacterLayerEntry extends CharacterLayerEntry {
  layer: number;
}

const CHARACTER_PREVIEW_STANDARD_SIZE = 16;
const CHARACTER_PREVIEW_STANDARD_AREA =
  CHARACTER_PREVIEW_STANDARD_SIZE * CHARACTER_PREVIEW_STANDARD_SIZE;

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

/**
 * キャラクタースプライトを前面から見た描画順で並べ替えます。
 * レイヤー値と元 index を使って UI 表示順を安定化させるための関数です。
 */
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
    (entries, entry) => [
      ...entries,
      { index: entry.index, sprite: entry.sprite },
    ],
    [],
  );
};

/**
 * キャラクタースプライトを背面から前面へ並べた順序で返します。
 * 配置や hit test など、逆順処理が必要な場面で同じ基準を再利用できるようにします。
 */
export const getCharacterLayerEntriesBackToFront = (
  sprites: CharacterSprite[],
): CharacterLayerEntry[] =>
  getCharacterLayerEntries(sprites).reduceRight<CharacterLayerEntry[]>(
    (entries, entry) => [...entries, entry],
    [],
  );

/**
 * 新しく追加するスプライトの既定レイヤー値を求めます。
 * 現在の最大レイヤーの直後へ置くことで、追加直後に最前面へ現れるようにする意図があります。
 */
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

/**
 * 選択中 index が現在のスプライト数に対して有効かを検証します。
 * 無効な選択を `Option.none` に落とし、UI が存在しない対象を参照しないようにします。
 */
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

/**
 * コンテキストメニューを表示してよい状態だけを通します。
 * モード不一致や未選択時には強制的に閉じ、表示条件をビュー外へ漏らさないための関数です。
 */
export const resolveVisibleSpriteContextMenu = <T>(
  isComposeMode: boolean,
  hasSelectedSprite: boolean,
  spriteContextMenu: O.Option<T>,
): O.Option<T> =>
  isComposeMode === true && hasSelectedSprite === true
    ? spriteContextMenu
    : O.none;

/**
 * スプライト削除後の次の選択 index を解決します。
 * 削除対象、後続要素の繰り上がり、末尾削除をまとめて扱い、選択状態を自然に維持する意図があります。
 */
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

/**
 * ポインタ座標をステージ座標へ変換し、許容範囲内に丸めます。
 * ドラッグや配置操作が表示倍率に依存せず正しいセル座標へ落ちるようにする関数です。
 */
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

/**
 * ステージ寸法とズーム段階から実際の表示倍率を求めます。
 * 小さいステージでも見やすさを保ちつつ、ズーム操作で段階的に拡大できるようにします。
 */
export const resolveCharacterStageScale = (
  stageWidth: number,
  stageHeight: number,
  zoomLevel: number,
): number => {
  const maxDimension = Math.max(1, stageWidth, stageHeight);
  const normalizedZoomLevel = Math.max(1, Math.floor(zoomLevel));
  const baseScale = clamp(
    Math.floor(CHARACTER_PREVIEW_STANDARD_AREA / maxDimension),
    1,
    CHARACTER_PREVIEW_STANDARD_AREA,
  );

  return baseScale * normalizedZoomLevel;
};

/**
 * 1 つのキャラクタースプライトを指定方向へ 1 マス移動します。
 * 境界を超えない範囲でだけ位置を更新し、キーボード操作を単純な純関数で扱えるようにします。
 */
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

/**
 * キャラクタースプライトのレイヤー値を相対的にずらします。
 * レイヤー範囲を 0..63 に保ったまま前後移動できるようにする補助関数です。
 */
export const shiftCharacterSpriteLayer = (
  sprite: CharacterSprite,
  amount: number,
): CharacterSprite => ({
  ...sprite,
  layer: clamp(sprite.layer + amount, 0, 63),
});
