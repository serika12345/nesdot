import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";
import {
  applyValidatedScreen,
  moveArrayItem,
  type ScreenModeGestureContextMenuState,
} from "./screenModeGestureShared";

type ScreenModeContextMenuStateDependencies = Pick<
  ScreenModeProjectStateResult,
  "scan" | "screen" | "setScreenAndSyncNes"
> & {
  closeContextMenu: () => void;
  contextMenu: O.Option<ScreenModeGestureContextMenuState>;
  replaceSelection: (nextSelection: ReadonlySet<number>) => void;
  selectedSpriteIndices: ReadonlySet<number>;
};

export interface ScreenModeContextMenuStateResult {
  close: () => void;
  handleDeleteSprites: () => void;
  handleLowerLayer: () => void;
  handleRaiseLayer: () => void;
  handleSetPriorityBehind: () => void;
  handleSetPriorityFront: () => void;
  handleToggleFlipH: () => void;
  handleToggleFlipV: () => void;
  menu: O.Option<ScreenModeGestureContextMenuState>;
}

export const useScreenModeContextMenuState = ({
  closeContextMenu,
  contextMenu,
  replaceSelection,
  scan,
  screen,
  selectedSpriteIndices,
  setScreenAndSyncNes,
}: ScreenModeContextMenuStateDependencies): ScreenModeContextMenuStateResult => {
  const resolveMenuTargetIndices = React.useCallback(
    (): ReadonlyArray<number> =>
      pipe(
        contextMenu,
        O.match(
          () => Array.from(selectedSpriteIndices),
          (menuState) =>
            pipe(
              menuState.targetSpriteIndex,
              O.match(
                () => Array.from(selectedSpriteIndices),
                (targetIndex) =>
                  selectedSpriteIndices.has(targetIndex)
                    ? Array.from(selectedSpriteIndices)
                    : [targetIndex],
              ),
            ),
        ),
      ),
    [contextMenu, selectedSpriteIndices],
  );

  const handleDeleteSprites = React.useCallback(() => {
    const targetIndices = resolveMenuTargetIndices();
    if (targetIndices.length === 0) {
      return;
    }

    const targetSet = new Set(targetIndices);
    const nextSprites = screen.sprites.filter(
      (_, index) => targetSet.has(index) === false,
    );
    const updated = applyValidatedScreen({
      nextScreen: {
        ...screen,
        sprites: nextSprites,
      },
      scan,
      setScreenAndSyncNes,
      silent: false,
      violationMessage: "削除後の状態で制約違反が検出されました:",
    });

    if (updated === true) {
      replaceSelection(new Set<number>());
      closeContextMenu();
    }
  }, [
    closeContextMenu,
    replaceSelection,
    resolveMenuTargetIndices,
    scan,
    screen,
    setScreenAndSyncNes,
  ]);

  const handleSetPriority = React.useCallback(
    (nextPriority: "front" | "behindBg"): void => {
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

      const updated = applyValidatedScreen({
        nextScreen: {
          ...screen,
          sprites: nextSprites,
        },
        scan,
        setScreenAndSyncNes,
        silent: false,
        violationMessage: "優先度の更新に失敗しました。制約違反:",
      });

      if (updated === true) {
        closeContextMenu();
      }
    },
    [
      closeContextMenu,
      resolveMenuTargetIndices,
      scan,
      screen,
      setScreenAndSyncNes,
    ],
  );

  const handleSetPriorityFront = React.useCallback(() => {
    handleSetPriority("front");
  }, [handleSetPriority]);

  const handleSetPriorityBehind = React.useCallback(() => {
    handleSetPriority("behindBg");
  }, [handleSetPriority]);

  const handleToggleFlip = React.useCallback(
    (axis: "h" | "v"): void => {
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
      closeContextMenu();
    },
    [closeContextMenu, resolveMenuTargetIndices, screen, setScreenAndSyncNes],
  );

  const handleToggleFlipH = React.useCallback(() => {
    handleToggleFlip("h");
  }, [handleToggleFlip]);

  const handleToggleFlipV = React.useCallback(() => {
    handleToggleFlip("v");
  }, [handleToggleFlip]);

  const shiftLayer = React.useCallback(
    (direction: "up" | "down"): void => {
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
        closeContextMenu();
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
      replaceSelection(new Set([nextIndex]));
      closeContextMenu();
    },
    [
      closeContextMenu,
      replaceSelection,
      resolveMenuTargetIndices,
      screen,
      setScreenAndSyncNes,
    ],
  );

  const handleRaiseLayer = React.useCallback(() => {
    shiftLayer("up");
  }, [shiftLayer]);

  const handleLowerLayer = React.useCallback(() => {
    shiftLayer("down");
  }, [shiftLayer]);

  return {
    close: closeContextMenu,
    handleDeleteSprites,
    handleLowerLayer,
    handleRaiseLayer,
    handleSetPriorityBehind,
    handleSetPriorityFront,
    handleToggleFlipH,
    handleToggleFlipV,
    menu: contextMenu,
  };
};
