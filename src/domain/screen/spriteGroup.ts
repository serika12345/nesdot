import * as O from "fp-ts/Option";
import { SpriteInScreen } from "../project/project";

export interface GroupBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculate bounding box for a group of sprites
 * Returns the minimum and maximum coordinates occupied by the group
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
 * Move all selected sprites by a delta offset
 * Returns new sprites array with selected sprites moved
 * Unselected sprites remain unchanged
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
 * Check if moving a group by delta would keep all sprites within screen bounds
 * Screen bounds: x in [0, 256), y in [0, 240)
 * Each sprite occupies (width, height) pixels from its (x, y) position
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
