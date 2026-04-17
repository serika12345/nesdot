import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
  type ProjectStoreState,
  type SpriteTile,
  useProjectState,
} from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import { type Tool } from "../../../../infrastructure/browser/canvas/useSpriteCanvas";
import {
  makeEmptySpriteModeTile,
  useSpriteModeActiveTile,
  useSpriteModeTileChangeAction,
} from "./spriteModeShared";

export interface SpriteModePaletteSlotsState {
  activePalette: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  handlePaletteClick: (slot: number) => void;
  palettes: ProjectStoreState["nes"]["spritePalettes"];
}

export interface SpriteModeToolMenuState {
  handleClearSprite: () => Promise<void>;
  handleToggleChangeOrderMode: () => void;
  handleToolChange: (nextTool: Tool) => void;
  isChangeOrderMode: boolean;
  tool: Tool;
}

export interface SpriteModeToolOverlayState {
  handleToggleTools: () => void;
  isToolsOpen: boolean;
  toolMenu: SpriteModeToolMenuState;
}

export interface SpriteModeCanvasSurfaceState {
  activePalette: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  activeSprite: number;
  handleTileChange: (tile: SpriteTile, index: number) => void;
  isChangeOrderMode: boolean;
  tool: Tool;
}

export interface SpriteModeCanvasPanelState {
  canvasSurface: SpriteModeCanvasSurfaceState;
  paletteSlots: SpriteModePaletteSlotsState;
  toolOverlay: SpriteModeToolOverlayState;
}

/**
 * `spriteMode` のキャンバス編集面が必要とする状態だけをまとめます。
 */
export const useSpriteModeCanvasPanelState = (): SpriteModeCanvasPanelState => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSlot = useWorkbenchState((state) => state.spriteMode.activeSlot);
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const isChangeOrderMode = useWorkbenchState(
    (state) => state.spriteMode.isChangeOrderMode,
  );
  const isToolsOpen = useWorkbenchState(
    (state) => state.spriteMode.isToolsOpen,
  );
  const setActiveSlot = useWorkbenchState(
    (state) => state.setSpriteModeActiveSlot,
  );
  const toggleToolsOpen = useWorkbenchState(
    (state) => state.toggleSpriteModeToolsOpen,
  );
  const toggleChangeOrderMode = useWorkbenchState(
    (state) => state.toggleSpriteModeChangeOrderMode,
  );
  const setTool = useWorkbenchState((state) => state.setSpriteModeTool);
  const tool = useWorkbenchState((state) => state.spriteMode.tool);
  const palettes = useProjectState((state) => state.nes.spritePalettes);
  const activeTile = useSpriteModeActiveTile();
  const handleTileChange = useSpriteModeTileChangeAction();

  const handlePaletteClick = useCallback(
    (slot: number): void => {
      if (slot !== 0 && slot !== 1 && slot !== 2 && slot !== 3) {
        return;
      }

      setActiveSlot(slot);
    },
    [setActiveSlot],
  );

  const handleToolChange = useCallback(
    (nextTool: Tool): void => {
      setTool(nextTool);
    },
    [setTool],
  );

  const handleClearSprite = useCallback(async (): Promise<void> => {
    const message = "本当にクリアしますか？";
    const shouldClear = await tauriConfirm(message, {
      title: "スプライトをクリア",
      okLabel: "クリア",
      cancelLabel: "キャンセル",
    }).catch(() => window.confirm(message));

    if (shouldClear === true) {
      handleTileChange(
        makeEmptySpriteModeTile(activeTile.height, activeTile.paletteIndex),
        activeSprite,
      );
    }
  }, [activeSprite, activeTile, handleTileChange]);

  return {
    paletteSlots: {
      activePalette,
      activeSlot,
      handlePaletteClick,
      palettes,
    },
    toolOverlay: {
      handleToggleTools: toggleToolsOpen,
      isToolsOpen,
      toolMenu: {
        handleClearSprite,
        handleToggleChangeOrderMode: toggleChangeOrderMode,
        handleToolChange,
        isChangeOrderMode,
        tool,
      },
    },
    canvasSurface: {
      activePalette,
      activeSlot,
      activeSprite,
      handleTileChange,
      isChangeOrderMode,
      tool,
    },
  };
};
