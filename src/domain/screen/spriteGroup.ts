import * as O from "fp-ts/Option";
import { SpriteInScreen } from "../project/project";

export interface GroupBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * 選択中スプライト群の外接矩形を求めます。
 * グループ移動やプレビューで必要になる占有範囲を、欠番を無視しながら集計する意図があります。
 */
export const getGroupBounds = (
  sprites: SpriteInScreen[],
  selectedIndices: Set<number>,
): GroupBounds => {
  return Array.from(selectedIndices).reduce<GroupBounds>(
    (acc, index) => {
      const spriteOption = O.fromNullable(sprites[index]);
      if (O.isNone(spriteOption)) {
        return acc;
      }
      const sprite = spriteOption.value;

      return {
        minX: Math.min(acc.minX, sprite.x),
        minY: Math.min(acc.minY, sprite.y),
        maxX: Math.max(acc.maxX, sprite.x + sprite.width),
        maxY: Math.max(acc.maxY, sprite.y + sprite.height),
      };
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  );
};

/**
 * 選択中スプライト群を指定差分だけ平行移動します。
 * 未選択要素は保持したまま、グループ移動後の新しい配列を不変更新で返します。
 */
export const moveGroupByDelta = (
  sprites: SpriteInScreen[],
  selectedIndices: Set<number>,
  deltaX: number,
  deltaY: number,
): SpriteInScreen[] => {
  return sprites.map((sprite, index) => {
    if (!selectedIndices.has(index)) {
      return sprite;
    }

    return {
      ...sprite,
      x: sprite.x + deltaX,
      y: sprite.y + deltaY,
    };
  });
};

/**
 * グループ移動後も全スプライトが画面内に収まるかを判定します。
 * 実際に状態を更新する前に、境界外へのはみ出しを安全側で止めるための検証関数です。
 */
export const isValidGroupMovement = (
  sprites: SpriteInScreen[],
  selectedIndices: Set<number>,
  deltaX: number,
  deltaY: number,
): boolean => {
  const SCREEN_WIDTH = 256;
  const SCREEN_HEIGHT = 240;

  return Array.from(selectedIndices).every((index) => {
    const spriteOption = O.fromNullable(sprites[index]);
    if (O.isNone(spriteOption)) {
      return false;
    }
    const sprite = spriteOption.value;

    const newX = sprite.x + deltaX;
    const newY = sprite.y + deltaY;
    const newMaxX = newX + sprite.width;
    const newMaxY = newY + sprite.height;

    const isInBounds =
      newX >= 0 &&
      newY >= 0 &&
      newMaxX <= SCREEN_WIDTH &&
      newMaxY <= SCREEN_HEIGHT;

    return isInBounds;
  });
};
