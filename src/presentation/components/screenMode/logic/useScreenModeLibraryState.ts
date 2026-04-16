import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteInScreen } from "../../../../application/state/projectStore";
import { expandCharacterToScreenSprites } from "../../../../domain/characters/characterSet";
import { trySetPointerCapture } from "../../characterMode/logic/input/pointerCapture";
import {
  createScreenModeCharacterPreviewCards,
  type ScreenModeCharacterPreviewCard,
} from "./screenModeCharacterPreviewCards";
import {
  applyValidatedScreen,
  type ScreenModeLibraryDragState,
  type StagePoint,
} from "./screenModeGestureShared";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

type ScreenModeLibraryStateDependencies = Pick<
  ScreenModeProjectStateResult,
  | "characterSets"
  | "nes"
  | "scan"
  | "screen"
  | "setScreenAndSyncNes"
  | "sprites"
> & {
  closeContextMenu: () => void;
  replaceSelection: (nextSelection: ReadonlySet<number>) => void;
  resolveStagePointFromClient: (
    clientX: number,
    clientY: number,
  ) => O.Option<StagePoint>;
};

export interface ScreenModeLibraryPresentationState {
  characterPreviewCards: ReadonlyArray<ScreenModeCharacterPreviewCard>;
  dragState: O.Option<ScreenModeLibraryDragState>;
  handleCharacterPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    characterId: string,
  ) => void;
  handleSpritePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
}

export interface ScreenModeLibraryStateResult {
  handleWorkspacePointerEndCapture: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerMoveCapture: React.PointerEventHandler<HTMLDivElement>;
  libraryState: ScreenModeLibraryPresentationState;
}

export const useScreenModeLibraryState = ({
  characterSets,
  closeContextMenu,
  nes,
  replaceSelection,
  resolveStagePointFromClient,
  scan,
  screen,
  setScreenAndSyncNes,
  sprites,
}: ScreenModeLibraryStateDependencies): ScreenModeLibraryStateResult => {
  const [dragState, setDragState] = React.useState<
    O.Option<ScreenModeLibraryDragState>
  >(O.none);

  const characterPreviewCards = React.useMemo(
    () =>
      createScreenModeCharacterPreviewCards({
        characterSets,
        spritePalettes: nes.spritePalettes,
        sprites,
      }),
    [characterSets, nes.spritePalettes, sprites],
  );

  const handleDropSprite = React.useCallback(
    (spriteIndex: number, point: StagePoint): void => {
      const sourceSprite = sprites[spriteIndex];

      if (typeof sourceSprite === "undefined") {
        alert("指定されたスプライト番号のスプライトが存在しません");
        return;
      }

      const x = Math.max(
        0,
        Math.min(
          point.x - Math.floor(sourceSprite.width / 2),
          screen.width - sourceSprite.width,
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          point.y - Math.floor(sourceSprite.height / 2),
          screen.height - sourceSprite.height,
        ),
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
      const updated = applyValidatedScreen({
        nextScreen: {
          ...screen,
          sprites: nextSprites,
        },
        scan,
        setScreenAndSyncNes,
        silent: false,
        violationMessage: "スプライトの追加に失敗しました。制約違反:",
      });

      if (updated === true) {
        replaceSelection(new Set([nextSprites.length - 1]));
      }
    },
    [replaceSelection, scan, screen, setScreenAndSyncNes, sprites],
  );

  const handleDropCharacter = React.useCallback(
    (characterId: string, point: StagePoint): void => {
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
      const updated = applyValidatedScreen({
        nextScreen: {
          ...screen,
          sprites: nextSprites,
        },
        scan,
        setScreenAndSyncNes,
        silent: false,
        violationMessage: "キャラクターの追加に失敗しました。制約違反:",
      });

      if (updated === true) {
        const startIndex = screen.sprites.length;
        replaceSelection(
          new Set(placement.right.map((_, index) => startIndex + index)),
        );
      }
    },
    [
      characterSets,
      replaceSelection,
      scan,
      screen,
      setScreenAndSyncNes,
      sprites,
    ],
  );

  const handleWorkspacePointerMoveCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        dragState,
        O.filter(
          (currentDragState) => currentDragState.pointerId === event.pointerId,
        ),
        O.map((currentDragState) =>
          setDragState(
            O.some({
              ...currentDragState,
              clientX: event.clientX,
              clientY: event.clientY,
            }),
          ),
        ),
      );
    },
    [dragState],
  );

  const handleWorkspacePointerEndCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        dragState,
        O.filter(
          (currentDragState) => currentDragState.pointerId === event.pointerId,
        ),
        O.map((currentDragState) => {
          const dropPoint = resolveStagePointFromClient(
            event.clientX,
            event.clientY,
          );

          if (O.isSome(dropPoint)) {
            if (currentDragState.kind === "sprite") {
              handleDropSprite(currentDragState.spriteIndex, dropPoint.value);
            }

            if (currentDragState.kind === "character") {
              handleDropCharacter(
                currentDragState.characterId,
                dropPoint.value,
              );
            }
          }

          setDragState(O.none);
        }),
      );
    },
    [
      dragState,
      handleDropCharacter,
      handleDropSprite,
      resolveStagePointFromClient,
    ],
  );

  const handleSpritePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, spriteIndex: number) => {
      if (event.button !== 0) {
        return;
      }

      closeContextMenu();
      setDragState(
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
    [closeContextMenu],
  );

  const handleCharacterPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, characterId: string) => {
      if (event.button !== 0) {
        return;
      }

      closeContextMenu();
      setDragState(
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
    [closeContextMenu],
  );

  return {
    handleWorkspacePointerEndCapture,
    handleWorkspacePointerMoveCapture,
    libraryState: {
      characterPreviewCards,
      dragState,
      handleCharacterPointerDown,
      handleSpritePointerDown,
    },
  };
};
