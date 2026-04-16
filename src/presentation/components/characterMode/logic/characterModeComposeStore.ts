import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { create } from "zustand";
import { useCharacterState } from "../../../../application/state/characterStore";
import { selectActiveSet } from "./characterModeSelectors";
import { isInRange } from "./geometry/characterModeBounds";
import {
  getNextCharacterSpriteLayer,
  nudgeCharacterSprite,
  resolveSelectionAfterSpriteRemoval,
  shiftCharacterSpriteLayer,
} from "./model/characterEditorModel";
import { useCharacterModeStageStore } from "./characterModeStageStore";
import type {
  LibraryDragState,
  SpriteContextMenuState,
} from "./types/characterModeInteractionState";

export interface CharacterModeComposeStoreState {
  libraryDragState: O.Option<LibraryDragState>;
  selectedSpriteEditorIndex: O.Option<number>;
  spriteContextMenuState: O.Option<SpriteContextMenuState>;
  setLibraryDragState: (state: O.Option<LibraryDragState>) => void;
  setSelectedSpriteEditorIndex: (index: O.Option<number>) => void;
  setSpriteContextMenuState: (state: O.Option<SpriteContextMenuState>) => void;
  clearSelectionAndDrag: () => void;
  closeSpriteContextMenu: () => void;
  handleDeleteContextMenuSprite: (spriteEditorIndex: number) => void;
  handleShiftContextMenuSpriteLayer: (
    spriteEditorIndex: number,
    amount: number,
  ) => void;
  handleNudgeSelectedSprite: (
    direction: "left" | "right" | "up" | "down",
  ) => void;
  handleDeleteSelectedSprite: () => void;
  handleDropSpriteOnStage: (
    spriteIndex: number,
    stageX: number,
    stageY: number,
  ) => void;
}

export const useCharacterModeComposeStore =
  create<CharacterModeComposeStoreState>()((set, get) => ({
    libraryDragState: O.none,
    selectedSpriteEditorIndex: O.none,
    spriteContextMenuState: O.none,

    setLibraryDragState: (state) => set({ libraryDragState: state }),
    setSelectedSpriteEditorIndex: (index) =>
      set({ selectedSpriteEditorIndex: index, spriteContextMenuState: O.none }),
    setSpriteContextMenuState: (state) =>
      set({ spriteContextMenuState: state }),

    clearSelectionAndDrag: () =>
      set({
        selectedSpriteEditorIndex: O.none,
        spriteContextMenuState: O.none,
        libraryDragState: O.none,
      }),

    closeSpriteContextMenu: () => set({ spriteContextMenuState: O.none }),

    handleDeleteContextMenuSprite: (spriteEditorIndex) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );

      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            O.fromNullable(characterSet.sprites[spriteEditorIndex]),
            O.map(() => ({
              setId: characterSet.id,
              spriteCount: characterSet.sprites.length,
            })),
          ),
        ),
        O.map(({ setId, spriteCount }) => {
          characterState.removeSprite(setId, spriteEditorIndex);
          set({
            spriteContextMenuState: O.none,
            selectedSpriteEditorIndex: resolveSelectionAfterSpriteRemoval(
              get().selectedSpriteEditorIndex,
              spriteEditorIndex,
              spriteCount - 1,
            ),
          });
        }),
      );
    },

    handleShiftContextMenuSpriteLayer: (spriteEditorIndex, amount) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      const { stageWidth, stageHeight } = useCharacterModeStageStore.getState();

      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            O.fromNullable(characterSet.sprites[spriteEditorIndex]),
            O.map((sprite) => ({ setId: characterSet.id, sprite })),
          ),
        ),
        O.map(({ setId, sprite }) => {
          const nextSprite = shiftCharacterSpriteLayer(sprite, amount);

          if (
            isInRange(nextSprite.spriteIndex, 0, 63) &&
            isInRange(nextSprite.x, 0, stageWidth - 1) &&
            isInRange(nextSprite.y, 0, stageHeight - 1) &&
            isInRange(nextSprite.layer, 0, 63)
          ) {
            characterState.setSprite(setId, spriteEditorIndex, nextSprite);
          }
        }),
      );

      set({ spriteContextMenuState: O.none });
    },

    handleNudgeSelectedSprite: (direction) => {
      const { selectedSpriteEditorIndex } = get();
      const { stageWidth, stageHeight } = useCharacterModeStageStore.getState();
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );

      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            selectedSpriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(characterSet.sprites[index]),
                O.map((sprite) => ({ characterSet, index, sprite })),
              ),
            ),
          ),
        ),
        O.map(({ characterSet, index, sprite }) => {
          const nextSprite = nudgeCharacterSprite(
            sprite,
            direction,
            stageWidth - 1,
            stageHeight - 1,
          );

          if (
            isInRange(nextSprite.spriteIndex, 0, 63) &&
            isInRange(nextSprite.x, 0, stageWidth - 1) &&
            isInRange(nextSprite.y, 0, stageHeight - 1) &&
            isInRange(nextSprite.layer, 0, 63)
          ) {
            characterState.setSprite(characterSet.id, index, nextSprite);
          }
        }),
      );

      set({ spriteContextMenuState: O.none });
    },

    handleDeleteSelectedSprite: () => {
      const { selectedSpriteEditorIndex } = get();
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );

      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            selectedSpriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(characterSet.sprites[index]),
                O.map(() => ({
                  setId: characterSet.id,
                  index,
                  spriteCount: characterSet.sprites.length,
                })),
              ),
            ),
          ),
        ),
        O.map(({ setId, index, spriteCount }) => {
          characterState.removeSprite(setId, index);
          set({
            spriteContextMenuState: O.none,
            selectedSpriteEditorIndex: resolveSelectionAfterSpriteRemoval(
              get().selectedSpriteEditorIndex,
              index,
              spriteCount - 1,
            ),
          });
        }),
      );
    },

    handleDropSpriteOnStage: (spriteIndex, stageX, stageY) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );

      pipe(
        activeSet,
        O.map((characterSet) => {
          characterState.addSprite(characterSet.id, {
            spriteIndex,
            x: stageX,
            y: stageY,
            layer: getNextCharacterSpriteLayer(characterSet.sprites),
          });
          set({
            selectedSpriteEditorIndex: O.some(characterSet.sprites.length),
            spriteContextMenuState: O.none,
            libraryDragState: O.none,
          });
        }),
      );
    },
  }));
