import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  type Screen,
  type SpriteInScreen,
} from "../../../../application/state/projectStore";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

interface AxisBounds {
  min: number;
  max: number;
}

export interface StagePoint {
  x: number;
  y: number;
}

export interface StageMoveEntry {
  index: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export interface StageMoveDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  entries: ReadonlyArray<StageMoveEntry>;
}

export interface StageMarqueeState {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  additive: boolean;
}

export interface ScreenModeMarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ScreenModeLibraryDragState =
  | {
      kind: "sprite";
      pointerId: number;
      clientX: number;
      clientY: number;
      spriteIndex: number;
    }
  | {
      kind: "character";
      pointerId: number;
      clientX: number;
      clientY: number;
      characterId: string;
    };

export interface ScreenModeGestureContextMenuState {
  clientX: number;
  clientY: number;
  targetSpriteIndex: O.Option<number>;
}

export const toggleSelectionIndex = (
  previous: ReadonlySet<number>,
  index: number,
): ReadonlySet<number> =>
  previous.has(index)
    ? new Set(Array.from(previous).filter((value) => value !== index))
    : new Set([...previous, index]);

export const resolveHitSpriteIndex = (
  sprites: ReadonlyArray<SpriteInScreen>,
  point: StagePoint,
): O.Option<number> => {
  const index = sprites.findIndex(
    (sprite) =>
      point.x >= sprite.x &&
      point.x < sprite.x + sprite.width &&
      point.y >= sprite.y &&
      point.y < sprite.y + sprite.height,
  );

  return index >= 0 ? O.some(index) : O.none;
};

const resolveMarqueeBounds = (
  state: StageMarqueeState,
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} => ({
  minX: Math.min(state.startX, state.currentX),
  minY: Math.min(state.startY, state.currentY),
  maxX: Math.max(state.startX, state.currentX),
  maxY: Math.max(state.startY, state.currentY),
});

export const resolveMarqueeRect = (
  state: StageMarqueeState,
): ScreenModeMarqueeRect => {
  const bounds = resolveMarqueeBounds(state);

  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX + 1,
    height: bounds.maxY - bounds.minY + 1,
  };
};

export const resolveMarqueeSelection = (
  sprites: ReadonlyArray<SpriteInScreen>,
  state: StageMarqueeState,
): ReadonlySet<number> => {
  const rect = resolveMarqueeBounds(state);

  return new Set(
    sprites.flatMap((sprite, index) => {
      const spriteMinX = sprite.x;
      const spriteMinY = sprite.y;
      const spriteMaxX = sprite.x + sprite.width - 1;
      const spriteMaxY = sprite.y + sprite.height - 1;
      const overlaps =
        rect.maxX >= spriteMinX &&
        rect.minX <= spriteMaxX &&
        rect.maxY >= spriteMinY &&
        rect.minY <= spriteMaxY;

      return overlaps ? [index] : [];
    }),
  );
};

export const resolveMoveEntries = (
  sprites: ReadonlyArray<SpriteInScreen>,
  selectedIndices: ReadonlySet<number>,
): ReadonlyArray<StageMoveEntry> =>
  Array.from(selectedIndices).flatMap((index) =>
    pipe(
      O.fromNullable(sprites[index]),
      O.match(
        (): ReadonlyArray<StageMoveEntry> => [],
        (sprite): ReadonlyArray<StageMoveEntry> => [
          {
            index,
            startX: sprite.x,
            startY: sprite.y,
            width: sprite.width,
            height: sprite.height,
          },
        ],
      ),
    ),
  );

export const resolveBoundedDelta = (
  screen: Screen,
  entries: ReadonlyArray<StageMoveEntry>,
  deltaX: number,
  deltaY: number,
): {
  x: number;
  y: number;
} => {
  const xBounds = entries.reduce<AxisBounds>(
    (bounds, entry) => ({
      min: Math.max(bounds.min, -entry.startX),
      max: Math.min(bounds.max, screen.width - (entry.startX + entry.width)),
    }),
    {
      min: -screen.width,
      max: screen.width,
    },
  );

  const yBounds = entries.reduce<AxisBounds>(
    (bounds, entry) => ({
      min: Math.max(bounds.min, -entry.startY),
      max: Math.min(bounds.max, screen.height - (entry.startY + entry.height)),
    }),
    {
      min: -screen.height,
      max: screen.height,
    },
  );

  return {
    x: clamp(deltaX, xBounds.min, xBounds.max),
    y: clamp(deltaY, yBounds.min, yBounds.max),
  };
};

export const moveArrayItem = <T>(
  items: ReadonlyArray<T>,
  fromIndex: number,
  toIndex: number,
): ReadonlyArray<T> => {
  const targetItemOption = O.fromNullable(items[fromIndex]);
  if (O.isNone(targetItemOption)) {
    return items;
  }

  const withoutTarget = items.filter((_, index) => index !== fromIndex);
  const boundedIndex = clamp(toIndex, 0, withoutTarget.length);

  return [
    ...withoutTarget.slice(0, boundedIndex),
    targetItemOption.value,
    ...withoutTarget.slice(boundedIndex),
  ];
};

interface ApplyValidatedScreenDependencies {
  nextScreen: Screen;
  scan: ScreenModeProjectStateResult["scan"];
  setScreenAndSyncNes: ScreenModeProjectStateResult["setScreenAndSyncNes"];
  silent: boolean;
  violationMessage: string;
}

export const applyValidatedScreen = ({
  nextScreen,
  scan,
  setScreenAndSyncNes,
  silent,
  violationMessage,
}: ApplyValidatedScreenDependencies): boolean => {
  const report = scan(nextScreen);

  if (report.ok === false) {
    if (silent === false) {
      alert(`${violationMessage}\n${report.errors.join("\n")}`);
    }

    return false;
  }

  setScreenAndSyncNes(nextScreen);
  return true;
};
