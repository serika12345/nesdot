import * as O from "fp-ts/Option";
import { create } from "zustand";
import { type Tool as SpriteTool } from "../../infrastructure/browser/canvas/useSpriteCanvas";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
  useProjectState,
} from "./projectStore";

export type WorkMode = "screen" | "sprite" | "character" | "bg";

type BgTool = "pen" | "eraser";

interface WorkbenchState {
  editMode: WorkMode;
  setEditMode: (nextMode: WorkMode) => void;
  spriteMode: {
    tool: SpriteTool;
    isChangeOrderMode: boolean;
    activePalette: PaletteIndex;
    activeSlot: ColorIndexOfPalette;
    activeSprite: number;
    isToolsOpen: boolean;
  };
  setSpriteModeTool: (nextTool: SpriteTool) => void;
  toggleSpriteModeChangeOrderMode: () => void;
  setSpriteModeActivePalette: (nextActivePalette: PaletteIndex) => void;
  setSpriteModeActiveSlot: (nextActiveSlot: ColorIndexOfPalette) => void;
  setSpriteModeActiveSprite: (nextActiveSprite: number) => void;
  toggleSpriteModeToolsOpen: () => void;
  bgMode: {
    selectedTileIndex: number;
    tool: BgTool;
    activePaletteIndex: PaletteIndex;
    isToolMenuOpen: boolean;
  };
  setBgModeSelectedTileIndex: (nextSelectedTileIndex: number) => void;
  setBgModeTool: (nextTool: BgTool) => void;
  setBgModeActivePaletteIndex: (nextActivePaletteIndex: PaletteIndex) => void;
  setBgModeToolMenuOpen: (nextIsToolMenuOpen: boolean) => void;
  screenMode: {
    selectedSpriteIndex: O.Option<number>;
    isSelectionOpen: boolean;
  };
  setScreenModeSelectedSpriteIndex: (
    nextSelectedSpriteIndex: O.Option<number>,
  ) => void;
  setScreenModeSelectionOpen: (nextIsSelectionOpen: boolean) => void;
}

const initialSelectedSpriteIndex =
  useProjectState.getState().screen.sprites.length > 0 ? O.some(0) : O.none;

export const useWorkbenchState = create<WorkbenchState>()((set) => ({
  editMode: "sprite",
  setEditMode: (nextMode) => {
    set({ editMode: nextMode });
  },
  spriteMode: {
    tool: "pen",
    isChangeOrderMode: false,
    activePalette: 0,
    activeSlot: 1,
    activeSprite: 0,
    isToolsOpen: false,
  },
  setSpriteModeTool: (nextTool) => {
    set((state) => ({
      spriteMode: {
        ...state.spriteMode,
        tool: nextTool,
      },
    }));
  },
  toggleSpriteModeChangeOrderMode: () => {
    set((state) => ({
      spriteMode: {
        ...state.spriteMode,
        isChangeOrderMode: state.spriteMode.isChangeOrderMode === false,
      },
    }));
  },
  setSpriteModeActivePalette: (nextActivePalette) => {
    set((state) => ({
      spriteMode: {
        ...state.spriteMode,
        activePalette: nextActivePalette,
      },
    }));
  },
  setSpriteModeActiveSlot: (nextActiveSlot) => {
    set((state) => ({
      spriteMode: {
        ...state.spriteMode,
        activeSlot: nextActiveSlot,
      },
    }));
  },
  setSpriteModeActiveSprite: (nextActiveSprite) => {
    set((state) => ({
      spriteMode: {
        ...state.spriteMode,
        activeSprite: nextActiveSprite,
      },
    }));
  },
  toggleSpriteModeToolsOpen: () => {
    set((state) => ({
      spriteMode: {
        ...state.spriteMode,
        isToolsOpen: state.spriteMode.isToolsOpen === false,
      },
    }));
  },
  bgMode: {
    selectedTileIndex: 0,
    tool: "pen",
    activePaletteIndex: 0,
    isToolMenuOpen: false,
  },
  setBgModeSelectedTileIndex: (nextSelectedTileIndex) => {
    set((state) => ({
      bgMode: {
        ...state.bgMode,
        selectedTileIndex: nextSelectedTileIndex,
      },
    }));
  },
  setBgModeTool: (nextTool) => {
    set((state) => ({
      bgMode: {
        ...state.bgMode,
        tool: nextTool,
      },
    }));
  },
  setBgModeActivePaletteIndex: (nextActivePaletteIndex) => {
    set((state) => ({
      bgMode: {
        ...state.bgMode,
        activePaletteIndex: nextActivePaletteIndex,
      },
    }));
  },
  setBgModeToolMenuOpen: (nextIsToolMenuOpen) => {
    set((state) => ({
      bgMode: {
        ...state.bgMode,
        isToolMenuOpen: nextIsToolMenuOpen,
      },
    }));
  },
  screenMode: {
    selectedSpriteIndex: initialSelectedSpriteIndex,
    isSelectionOpen: false,
  },
  setScreenModeSelectedSpriteIndex: (nextSelectedSpriteIndex) => {
    set((state) => ({
      screenMode: {
        ...state.screenMode,
        selectedSpriteIndex: nextSelectedSpriteIndex,
      },
    }));
  },
  setScreenModeSelectionOpen: (nextIsSelectionOpen) => {
    set((state) => ({
      screenMode: {
        ...state.screenMode,
        isSelectionOpen: nextIsSelectionOpen,
      },
    }));
  },
}));
