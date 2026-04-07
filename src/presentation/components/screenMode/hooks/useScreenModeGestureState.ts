import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  type Screen,
  type SpriteInScreen,
} from "../../../../application/state/projectStore";
import { expandCharacterToScreenSprites } from "../../../../domain/characters/characterSet";
import { trySetPointerCapture } from "../../characterMode/input/pointerCapture";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

interface StagePoint {
  x: number;
  y: number;
}

interface StageMoveEntry {
  index: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
}

interface StageMoveDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  entries: ReadonlyArray<StageMoveEntry>;
}

interface AxisBounds {
  min: number;
  max: number;
}

interface StageMarqueeState {
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

export interface ScreenModeCharacterPreviewCard {
  id: string;
  name: string;
  spriteCount: number;
  previewSpriteIndices: ReadonlyArray<number>;
}

type ScreenModeGestureDependencies = Pick<
  ScreenModeProjectStateResult,
  "characterSets" | "scan" | "screen" | "setScreenAndSyncNes" | "sprites"
> & {
  screenZoomLevel: number;
};

export interface ScreenModeGestureStateResult {
  characterPreviewCards: ReadonlyArray<ScreenModeCharacterPreviewCard>;
  gestureContextMenu: O.Option<ScreenModeGestureContextMenuState>;
  gestureLibraryDragState: O.Option<ScreenModeLibraryDragState>;
  gestureMarqueeRect: O.Option<ScreenModeMarqueeRect>;
  gestureSelectedSpriteCount: number;
  gestureSelectedSpriteIndices: ReadonlySet<number>;
  gestureStageSpriteLayout: string;
  isStageDragging: boolean;
  closeGestureContextMenu: () => void;
  handleDeleteGestureContextMenuSprites: () => void;
  handleLibraryCharacterPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    characterId: string,
  ) => void;
  handleLibrarySpritePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  handleLowerGestureContextMenuLayer: () => void;
  handleRaiseGestureContextMenuLayer: () => void;
  handleSetGesturePriorityBehind: () => void;
  handleSetGesturePriorityFront: () => void;
  handleStageContextMenu: React.MouseEventHandler<HTMLDivElement>;
  handleStagePointerDown: React.PointerEventHandler<HTMLDivElement>;
  handleStagePointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleStagePointerMove: React.PointerEventHandler<HTMLDivElement>;
  handleToggleGestureFlipH: () => void;
  handleToggleGestureFlipV: () => void;
  handleWorkspacePointerDownCapture: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerEndCapture: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerMoveCapture: React.PointerEventHandler<HTMLDivElement>;
  setStageRef: (element: HTMLDivElement | null) => void;
}

const toggleSelectionIndex = (
  previous: ReadonlySet<number>,
  index: number,
): ReadonlySet<number> =>
  previous.has(index)
    ? new Set(Array.from(previous).filter((value) => value !== index))
    : new Set([...previous, index]);

const resolveHitSpriteIndex = (
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

const resolveMarqueeRect = (
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

const resolveMarqueeSelection = (
  sprites: ReadonlyArray<SpriteInScreen>,
  state: StageMarqueeState,
): ReadonlySet<number> => {
  const rect = resolveMarqueeRect(state);

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

const resolveMoveEntries = (
  sprites: ReadonlyArray<SpriteInScreen>,
  selectedIndices: ReadonlySet<number>,
): ReadonlyArray<StageMoveEntry> =>
  Array.from(selectedIndices).flatMap((index) => {
    const sprite = sprites[index];

    return typeof sprite === "undefined"
      ? []
      : [
          {
            index,
            startX: sprite.x,
            startY: sprite.y,
            width: sprite.width,
            height: sprite.height,
          },
        ];
  });

const resolveBoundedDelta = (
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

const moveArrayItem = <T>(
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

const resolveCharacterPreviewCards = (
  characterSets: ScreenModeProjectStateResult["characterSets"],
): ReadonlyArray<ScreenModeCharacterPreviewCard> =>
  characterSets.map((characterSet) => ({
    id: characterSet.id,
    name: characterSet.name,
    spriteCount: characterSet.sprites.length,
    previewSpriteIndices: characterSet.sprites
      .slice(0, 3)
      .map((sprite) => sprite.spriteIndex),
  }));

/**
 * `screenMode` のジェスチャー操作を扱います。
 * スプライト/キャラクターのドロップ、ステージ上の選択と移動、右クリックメニュー操作を統合します。
 */
export const useScreenModeGestureState = ({
  characterSets,
  scan,
  screen,
  screenZoomLevel,
  setScreenAndSyncNes,
  sprites,
}: ScreenModeGestureDependencies): ScreenModeGestureStateResult => {
  const [gestureSelectedSpriteIndices, setGestureSelectedSpriteIndices] =
    React.useState<ReadonlySet<number>>(() => new Set());
  const [gestureContextMenu, setGestureContextMenu] = React.useState<
    O.Option<ScreenModeGestureContextMenuState>
  >(O.none);
  const [gestureLibraryDragState, setGestureLibraryDragState] = React.useState<
    O.Option<ScreenModeLibraryDragState>
  >(O.none);
  const [stageMoveDragState, setStageMoveDragState] = React.useState<
    O.Option<StageMoveDragState>
  >(O.none);
  const [stageMarqueeState, setStageMarqueeState] = React.useState<
    O.Option<StageMarqueeState>
  >(O.none);

  const stageElementRef = React.useRef<O.Option<HTMLDivElement>>(O.none);

  const setStageRef = React.useCallback((element: HTMLDivElement | null) => {
    stageElementRef.current = O.fromNullable(element);
  }, []);

  const gestureStageSpriteLayout = React.useMemo(
    () =>
      screen.sprites
        .map((sprite, index) => `${index}:${sprite.x},${sprite.y}`)
        .join("|"),
    [screen.sprites],
  );

  const characterPreviewCards = React.useMemo(
    () => resolveCharacterPreviewCards(characterSets),
    [characterSets],
  );

  const gestureMarqueeRect = React.useMemo(
    () =>
      pipe(
        stageMarqueeState,
        O.map((state) => {
          const bounds = resolveMarqueeRect(state);

          return {
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.maxX - bounds.minX + 1,
            height: bounds.maxY - bounds.minY + 1,
          };
        }),
      ),
    [stageMarqueeState],
  );

  React.useEffect(() => {
    const selected = Array.from(gestureSelectedSpriteIndices);
    const normalized = selected.filter(
      (index) => index >= 0 && index < screen.sprites.length,
    );

    if (normalized.length !== selected.length) {
      setGestureSelectedSpriteIndices(new Set(normalized));
    }
  }, [gestureSelectedSpriteIndices, screen.sprites.length]);

  const resolveStagePointFromClient = React.useCallback(
    (clientX: number, clientY: number): O.Option<StagePoint> =>
      pipe(
        stageElementRef.current,
        O.chain((stageElement) => {
          const rect = stageElement.getBoundingClientRect();
          const relativeX = clientX - rect.left;
          const relativeY = clientY - rect.top;
          const isWithinStage =
            relativeX >= 0 &&
            relativeY >= 0 &&
            relativeX < rect.width &&
            relativeY < rect.height;

          if (isWithinStage === false) {
            return O.none;
          }

          return O.some({
            x: Math.floor(relativeX / screenZoomLevel),
            y: Math.floor(relativeY / screenZoomLevel),
          });
        }),
      ),
    [screenZoomLevel],
  );

  const applySpritesWithValidation = React.useCallback(
    (
      nextSprites: SpriteInScreen[],
      violationMessage: string,
      silent: boolean,
    ): boolean => {
      const nextScreen = {
        ...screen,
        sprites: nextSprites,
      };
      const report = scan(nextScreen);

      if (report.ok === false) {
        if (silent === false) {
          alert(`${violationMessage}\n${report.errors.join("\n")}`);
        }

        return false;
      }

      setScreenAndSyncNes(nextScreen);
      return true;
    },
    [scan, screen, setScreenAndSyncNes],
  );

  const resolveMenuTargetIndices = React.useCallback(
    (): ReadonlyArray<number> =>
      pipe(
        gestureContextMenu,
        O.match(
          () => Array.from(gestureSelectedSpriteIndices),
          (menuState) =>
            pipe(
              menuState.targetSpriteIndex,
              O.match(
                () => Array.from(gestureSelectedSpriteIndices),
                (targetIndex) =>
                  gestureSelectedSpriteIndices.has(targetIndex)
                    ? Array.from(gestureSelectedSpriteIndices)
                    : [targetIndex],
              ),
            ),
        ),
      ),
    [gestureContextMenu, gestureSelectedSpriteIndices],
  );

  const closeGestureContextMenu = React.useCallback(() => {
    setGestureContextMenu(O.none);
  }, []);

  const handleDeleteGestureContextMenuSprites = React.useCallback(() => {
    const targetIndices = resolveMenuTargetIndices();
    if (targetIndices.length === 0) {
      return;
    }

    const targetSet = new Set(targetIndices);
    const nextSprites = screen.sprites.filter(
      (_, index) => targetSet.has(index) === false,
    );
    const updated = applySpritesWithValidation(
      nextSprites,
      "削除後の状態で制約違反が検出されました:",
      false,
    );

    if (updated === true) {
      setGestureSelectedSpriteIndices(new Set());
      setGestureContextMenu(O.none);
    }
  }, [applySpritesWithValidation, resolveMenuTargetIndices, screen.sprites]);

  const handleSetGesturePriority = React.useCallback(
    (nextPriority: "front" | "behindBg") => {
      const targetSet = new Set(resolveMenuTargetIndices());
      if (targetSet.size === 0) {
        return;
      }

      const nextSprites = screen.sprites.map((sprite, index) =>
        targetSet.has(index)
          ? {
              ...sprite,
              priority: nextPriority,
            }
          : sprite,
      );

      const updated = applySpritesWithValidation(
        nextSprites,
        "優先度の更新に失敗しました。制約違反:",
        false,
      );

      if (updated === true) {
        setGestureContextMenu(O.none);
      }
    },
    [applySpritesWithValidation, resolveMenuTargetIndices, screen.sprites],
  );

  const handleSetGesturePriorityFront = React.useCallback(() => {
    handleSetGesturePriority("front");
  }, [handleSetGesturePriority]);

  const handleSetGesturePriorityBehind = React.useCallback(() => {
    handleSetGesturePriority("behindBg");
  }, [handleSetGesturePriority]);

  const handleToggleGestureFlip = React.useCallback(
    (axis: "h" | "v") => {
      const targetSet = new Set(resolveMenuTargetIndices());
      if (targetSet.size === 0) {
        return;
      }

      const nextSprites = screen.sprites.map((sprite, index) => {
        if (targetSet.has(index) === false) {
          return sprite;
        }

        return axis === "h"
          ? {
              ...sprite,
              flipH: sprite.flipH === false,
            }
          : {
              ...sprite,
              flipV: sprite.flipV === false,
            };
      });

      setScreenAndSyncNes({
        ...screen,
        sprites: nextSprites,
      });
      setGestureContextMenu(O.none);
    },
    [resolveMenuTargetIndices, screen, setScreenAndSyncNes],
  );

  const handleToggleGestureFlipH = React.useCallback(() => {
    handleToggleGestureFlip("h");
  }, [handleToggleGestureFlip]);

  const handleToggleGestureFlipV = React.useCallback(() => {
    handleToggleGestureFlip("v");
  }, [handleToggleGestureFlip]);

  const shiftLayer = React.useCallback(
    (direction: "up" | "down") => {
      const targetIndices = resolveMenuTargetIndices();
      const firstTargetIndex = targetIndices[0];

      if (typeof firstTargetIndex === "undefined") {
        return;
      }

      const lastIndex = screen.sprites.length - 1;
      const nextIndex =
        direction === "up"
          ? Math.max(0, firstTargetIndex - 1)
          : Math.min(lastIndex, firstTargetIndex + 1);

      if (nextIndex === firstTargetIndex) {
        setGestureContextMenu(O.none);
        return;
      }

      const nextSprites = moveArrayItem(
        screen.sprites,
        firstTargetIndex,
        nextIndex,
      );

      setScreenAndSyncNes({
        ...screen,
        sprites: [...nextSprites],
      });
      setGestureSelectedSpriteIndices(new Set([nextIndex]));
      setGestureContextMenu(O.none);
    },
    [resolveMenuTargetIndices, screen, setScreenAndSyncNes],
  );

  const handleRaiseGestureContextMenuLayer = React.useCallback(() => {
    shiftLayer("up");
  }, [shiftLayer]);

  const handleLowerGestureContextMenuLayer = React.useCallback(() => {
    shiftLayer("down");
  }, [shiftLayer]);

  const handleDropSprite = React.useCallback(
    (spriteIndex: number, point: StagePoint) => {
      const sourceSprite = sprites[spriteIndex];

      if (typeof sourceSprite === "undefined") {
        alert("指定されたスプライト番号のスプライトが存在しません");
        return;
      }

      const x = clamp(
        point.x - Math.floor(sourceSprite.width / 2),
        0,
        screen.width - sourceSprite.width,
      );
      const y = clamp(
        point.y - Math.floor(sourceSprite.height / 2),
        0,
        screen.height - sourceSprite.height,
      );
      const candidate: SpriteInScreen = {
        ...sourceSprite,
        x,
        y,
        spriteIndex,
        priority: "front",
        flipH: false,
        flipV: false,
      };
      const nextSprites = [...screen.sprites, candidate];
      const updated = applySpritesWithValidation(
        nextSprites,
        "スプライトの追加に失敗しました。制約違反:",
        false,
      );

      if (updated === true) {
        setGestureSelectedSpriteIndices(new Set([nextSprites.length - 1]));
      }
    },
    [
      applySpritesWithValidation,
      screen.height,
      screen.sprites,
      screen.width,
      sprites,
    ],
  );

  const handleDropCharacter = React.useCallback(
    (characterId: string, point: StagePoint) => {
      const characterSet = characterSets.find(
        (entry) => entry.id === characterId,
      );

      if (typeof characterSet === "undefined") {
        return;
      }

      const placement = expandCharacterToScreenSprites(characterSet, {
        baseX: point.x,
        baseY: point.y,
        sprites,
      });

      if (placement._tag === "Left") {
        alert(`キャラクター追加に失敗しました: ${placement.left}`);
        return;
      }

      const nextSprites = [...screen.sprites, ...placement.right];
      const updated = applySpritesWithValidation(
        nextSprites,
        "キャラクターの追加に失敗しました。制約違反:",
        false,
      );

      if (updated === true) {
        const startIndex = screen.sprites.length;
        const selectedIndices = placement.right.map(
          (_, index) => startIndex + index,
        );

        setGestureSelectedSpriteIndices(new Set(selectedIndices));
      }
    },
    [applySpritesWithValidation, characterSets, screen.sprites, sprites],
  );

  const handleWorkspacePointerDownCapture = React.useCallback(() => {
    setGestureContextMenu(O.none);
  }, []);

  const handleWorkspacePointerMoveCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        gestureLibraryDragState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) =>
          setGestureLibraryDragState(
            O.some({
              ...dragState,
              clientX: event.clientX,
              clientY: event.clientY,
            }),
          ),
        ),
      );
    },
    [gestureLibraryDragState],
  );

  const handleWorkspacePointerEndCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        gestureLibraryDragState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const dropPoint = resolveStagePointFromClient(
            event.clientX,
            event.clientY,
          );

          if (O.isSome(dropPoint)) {
            if (dragState.kind === "sprite") {
              handleDropSprite(dragState.spriteIndex, dropPoint.value);
            }

            if (dragState.kind === "character") {
              handleDropCharacter(dragState.characterId, dropPoint.value);
            }
          }

          setGestureLibraryDragState(O.none);
        }),
      );
    },
    [
      gestureLibraryDragState,
      handleDropCharacter,
      handleDropSprite,
      resolveStagePointFromClient,
    ],
  );

  const handleLibrarySpritePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, spriteIndex: number) => {
      if (event.button !== 0) {
        return;
      }

      setGestureContextMenu(O.none);
      setGestureLibraryDragState(
        O.some({
          kind: "sprite",
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          spriteIndex,
        }),
      );
      trySetPointerCapture(event.currentTarget, event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handleLibraryCharacterPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, characterId: string) => {
      if (event.button !== 0) {
        return;
      }

      setGestureContextMenu(O.none);
      setGestureLibraryDragState(
        O.some({
          kind: "character",
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          characterId,
        }),
      );
      trySetPointerCapture(event.currentTarget, event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handleStagePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button === 1) {
        return;
      }

      const stagePoint = resolveStagePointFromClient(
        event.clientX,
        event.clientY,
      );
      if (O.isNone(stagePoint)) {
        return;
      }

      if (event.button === 2) {
        event.preventDefault();

        const hitIndexOption = resolveHitSpriteIndex(
          screen.sprites,
          stagePoint.value,
        );

        if (O.isSome(hitIndexOption)) {
          const targetIndex = hitIndexOption.value;
          const nextSelection = gestureSelectedSpriteIndices.has(targetIndex)
            ? gestureSelectedSpriteIndices
            : new Set([targetIndex]);

          if (gestureSelectedSpriteIndices.has(targetIndex) === false) {
            setGestureSelectedSpriteIndices(nextSelection);
          }

          setGestureContextMenu(
            O.some({
              clientX: event.clientX,
              clientY: event.clientY,
              targetSpriteIndex: O.some(targetIndex),
            }),
          );
          return;
        }

        if (gestureSelectedSpriteIndices.size > 0) {
          setGestureContextMenu(
            O.some({
              clientX: event.clientX,
              clientY: event.clientY,
              targetSpriteIndex: O.none,
            }),
          );
          return;
        }

        setGestureContextMenu(O.none);
        return;
      }

      setGestureContextMenu(O.none);
      const hitIndexOption = resolveHitSpriteIndex(
        screen.sprites,
        stagePoint.value,
      );

      if (event.shiftKey === true) {
        if (O.isSome(hitIndexOption)) {
          setGestureSelectedSpriteIndices((previous) =>
            toggleSelectionIndex(previous, hitIndexOption.value),
          );
          return;
        }

        setStageMarqueeState(
          O.some({
            pointerId: event.pointerId,
            startX: stagePoint.value.x,
            startY: stagePoint.value.y,
            currentX: stagePoint.value.x,
            currentY: stagePoint.value.y,
            additive: true,
          }),
        );
        trySetPointerCapture(event.currentTarget, event.pointerId);
        return;
      }

      if (O.isSome(hitIndexOption)) {
        const hitIndex = hitIndexOption.value;
        const nextSelection = gestureSelectedSpriteIndices.has(hitIndex)
          ? gestureSelectedSpriteIndices
          : new Set([hitIndex]);

        if (gestureSelectedSpriteIndices.has(hitIndex) === false) {
          setGestureSelectedSpriteIndices(nextSelection);
        }

        const entries = resolveMoveEntries(screen.sprites, nextSelection);
        if (entries.length === 0) {
          return;
        }

        setStageMoveDragState(
          O.some({
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            entries,
          }),
        );
        trySetPointerCapture(event.currentTarget, event.pointerId);
        event.preventDefault();
        return;
      }

      setGestureSelectedSpriteIndices(new Set());
      setStageMarqueeState(
        O.some({
          pointerId: event.pointerId,
          startX: stagePoint.value.x,
          startY: stagePoint.value.y,
          currentX: stagePoint.value.x,
          currentY: stagePoint.value.y,
          additive: false,
        }),
      );
      trySetPointerCapture(event.currentTarget, event.pointerId);
    },
    [gestureSelectedSpriteIndices, resolveStagePointFromClient, screen.sprites],
  );

  const handleStagePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        stageMoveDragState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const rawDeltaX = Math.round(
            (event.clientX - dragState.startClientX) / screenZoomLevel,
          );
          const rawDeltaY = Math.round(
            (event.clientY - dragState.startClientY) / screenZoomLevel,
          );
          const boundedDelta = resolveBoundedDelta(
            screen,
            dragState.entries,
            rawDeltaX,
            rawDeltaY,
          );
          const nextSprites = screen.sprites.map((sprite, index) => {
            const entry = dragState.entries.find(
              (candidate) => candidate.index === index,
            );

            return typeof entry === "undefined"
              ? sprite
              : {
                  ...sprite,
                  x: entry.startX + boundedDelta.x,
                  y: entry.startY + boundedDelta.y,
                };
          });

          const changed = nextSprites.some((sprite, index) => {
            const previous = screen.sprites[index];

            return (
              typeof previous !== "undefined" &&
              (sprite.x !== previous.x || sprite.y !== previous.y)
            );
          });

          if (changed === true) {
            applySpritesWithValidation(
              nextSprites,
              "移動に失敗しました。制約違反:",
              true,
            );
          }
        }),
      );

      pipe(
        stageMarqueeState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const pointOption = resolveStagePointFromClient(
            event.clientX,
            event.clientY,
          );

          if (O.isNone(pointOption)) {
            return;
          }

          setStageMarqueeState(
            O.some({
              ...dragState,
              currentX: pointOption.value.x,
              currentY: pointOption.value.y,
            }),
          );
        }),
      );
    },
    [
      applySpritesWithValidation,
      resolveStagePointFromClient,
      screen,
      screenZoomLevel,
      stageMarqueeState,
      stageMoveDragState,
    ],
  );

  const handleStagePointerEnd = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        stageMoveDragState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map(() => {
          setStageMoveDragState(O.none);
        }),
      );

      pipe(
        stageMarqueeState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const selectionFromMarquee = resolveMarqueeSelection(
            screen.sprites,
            dragState,
          );

          if (dragState.additive === true) {
            setGestureSelectedSpriteIndices(
              new Set([
                ...gestureSelectedSpriteIndices,
                ...selectionFromMarquee,
              ]),
            );
          }

          if (dragState.additive === false) {
            setGestureSelectedSpriteIndices(selectionFromMarquee);
          }

          setStageMarqueeState(O.none);
        }),
      );
    },
    [
      gestureSelectedSpriteIndices,
      screen.sprites,
      stageMarqueeState,
      stageMoveDragState,
    ],
  );

  const handleStageContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  return {
    characterPreviewCards,
    gestureContextMenu,
    gestureLibraryDragState,
    gestureMarqueeRect,
    gestureSelectedSpriteCount: gestureSelectedSpriteIndices.size,
    gestureSelectedSpriteIndices,
    gestureStageSpriteLayout,
    isStageDragging: O.isSome(stageMoveDragState),
    closeGestureContextMenu,
    handleDeleteGestureContextMenuSprites,
    handleLibraryCharacterPointerDown,
    handleLibrarySpritePointerDown,
    handleLowerGestureContextMenuLayer,
    handleRaiseGestureContextMenuLayer,
    handleSetGesturePriorityBehind,
    handleSetGesturePriorityFront,
    handleStageContextMenu,
    handleStagePointerDown,
    handleStagePointerEnd,
    handleStagePointerMove,
    handleToggleGestureFlipH,
    handleToggleGestureFlipV,
    handleWorkspacePointerDownCapture,
    handleWorkspacePointerEndCapture,
    handleWorkspacePointerMoveCapture,
    setStageRef,
  };
};
