import * as O from "fp-ts/Option";
import { create } from "zustand";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  useProjectState,
  type ProjectSpriteSize,
} from "../../../../application/state/projectStore";
import { createEmptySpriteTile } from "../../../../domain/project/project";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import { selectActiveSet } from "./characterModeSelectors";
import { useCharacterModeComposeStore } from "./characterModeComposeStore";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { isProjectSpriteSizeLocked } from "./project/projectSpriteSizeLock";
import { type CharacterEditorMode } from "./view/characterEditorMode";

const clearTransientSelections = (): void => {
  useCharacterModeComposeStore.getState().clearSelectionAndDrag();
  useCharacterModeDecompositionStore.setState({
    selectedRegionId: O.none,
    decompositionRegionContextMenuState: O.none,
    decompositionDrawState: O.none,
    decompositionRegionDragState: O.none,
  });
};

export interface CharacterModeProjectStoreState {
  editorMode: CharacterEditorMode;
  newName: string;
  setEditorMode: (mode: CharacterEditorMode) => void;
  setNewName: (value: string) => void;
  handleCreateSet: () => void;
  handleSelectSet: (value: string) => void;
  handleDeleteSet: (setId: string) => void;
  handleSetNameChange: (name: string) => void;
  handleEditorModeChange: (mode: CharacterEditorMode) => void;
  handleProjectSpriteSizeChange: (nextSpriteSize: ProjectSpriteSize) => void;
}

export const useCharacterModeProjectStore =
  create<CharacterModeProjectStoreState>()((set) => ({
    editorMode: "compose",
    newName: "New Character",

    setEditorMode: (mode) => set({ editorMode: mode }),
    setNewName: (value) => set({ newName: value }),

    handleCreateSet: () => {
      const { newName } = useCharacterModeProjectStore.getState();
      useCharacterState.getState().createSet({ name: newName });
      clearTransientSelections();
    },

    handleSelectSet: (value) => {
      useCharacterState
        .getState()
        .selectSet(value === "" ? O.none : O.some(value));
      clearTransientSelections();
    },

    handleDeleteSet: (setId) => {
      useCharacterState.getState().deleteSet(setId);
      clearTransientSelections();
    },

    handleSetNameChange: (name) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );

      if (O.isSome(activeSet)) {
        characterState.renameSet(activeSet.value.id, name);
      }
    },

    handleEditorModeChange: (mode) => {
      useCharacterModeComposeStore.getState().closeSpriteContextMenu();
      useCharacterModeDecompositionStore
        .getState()
        .closeDecompositionRegionContextMenu();
      set({ editorMode: mode });
    },

    handleProjectSpriteSizeChange: (nextSpriteSize) => {
      const characterState = useCharacterState.getState();
      const projectState = useProjectState.getState();
      const locked = isProjectSpriteSizeLocked(
        projectState.sprites,
        projectState.screen.sprites.length,
        characterState.characterSets,
      );

      if (locked === true || projectState.spriteSize === nextSpriteSize) {
        return;
      }

      const nextSprites = projectState.sprites.map((sprite) =>
        createEmptySpriteTile(nextSpriteSize, sprite.paletteIndex),
      );
      const nextScreen = {
        ...projectState.screen,
        sprites: [],
      };
      const nextNes = mergeScreenIntoNesOam(
        {
          ...projectState.nes,
          ppuControl: {
            ...projectState.nes.ppuControl,
            spriteSize: nextSpriteSize,
          },
        },
        nextScreen,
      );

      useProjectState.setState({
        spriteSize: nextSpriteSize,
        sprites: nextSprites,
        screen: nextScreen,
        nes: nextNes,
      });

      useCharacterModeComposeStore.getState().clearSelectionAndDrag();
      useCharacterModeDecompositionStore.setState({
        decompositionRegions: [],
        selectedRegionId: O.none,
        decompositionRegionContextMenuState: O.none,
        decompositionDrawState: O.none,
        decompositionRegionDragState: O.none,
      });
    },
  }));
