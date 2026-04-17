import React from "react";
import { useProjectState } from "../../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../../application/state/workbenchStore";
import { useBgModeTileEditorState } from "../../logic/bgModeWorkspaceEditingState";
import {
  BgModeEditorPanel,
  type BgModeEditorPanelState,
} from "../panels/BgModeEditorPanel";
import {
  BgModeLibraryPanel,
  type BgModeLibraryPanelState,
} from "../panels/BgModeLibraryPanel";
import { BgModeWorkspace } from "./BgModeWorkspace";

/**
 * bgMode の state と UI を接続する画面境界です。
 * store から読む値をここで panel 単位へ分配し、子コンポーネントは focused props だけを受け取ります。
 */
export const BgModeScreen: React.FC = () => {
  const activePaletteIndex = useWorkbenchState(
    (state) => state.bgMode.activePaletteIndex,
  );
  const isToolMenuOpen = useWorkbenchState(
    (state) => state.bgMode.isToolMenuOpen,
  );
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );
  const setActivePaletteIndex = useWorkbenchState(
    (state) => state.setBgModeActivePaletteIndex,
  );
  const setIsToolMenuOpen = useWorkbenchState(
    (state) => state.setBgModeToolMenuOpen,
  );
  const setSelectedTileIndex = useWorkbenchState(
    (state) => state.setBgModeSelectedTileIndex,
  );
  const setTool = useWorkbenchState((state) => state.setBgModeTool);
  const tool = useWorkbenchState((state) => state.bgMode.tool);
  const backgroundPalettes = useProjectState(
    (state) => state.nes.backgroundPalettes,
  );
  const universalBackgroundColor = useProjectState(
    (state) => state.nes.universalBackgroundColor,
  );
  const { handlePaintPixel, selectedTile, visibleBackgroundTiles } =
    useBgModeTileEditorState();
  const deferredVisibleBackgroundTiles = React.useDeferredValue(
    visibleBackgroundTiles,
  );

  const handleToolMenuToggle = React.useCallback((): void => {
    setIsToolMenuOpen(isToolMenuOpen === false);
  }, [isToolMenuOpen, setIsToolMenuOpen]);

  const editorPanelState: BgModeEditorPanelState = {
    canvasState: {
      activePaletteIndex,
      backgroundPalettes,
      handlePaintPixel,
      selectedTile,
      universalBackgroundColor,
    },
    handleToolMenuToggle,
    isToolMenuOpen,
    toolMenuState: {
      activePaletteIndex,
      handlePaletteChange: setActivePaletteIndex,
      handleToolChange: setTool,
      tool,
    },
  };

  const libraryPanelState: BgModeLibraryPanelState = {
    activePaletteIndex,
    backgroundPalettes,
    handleSelectTile: setSelectedTileIndex,
    selectedTileIndex,
    tiles: deferredVisibleBackgroundTiles,
    universalBackgroundColor,
  };

  return (
    <BgModeWorkspace
      editorPanel={<BgModeEditorPanel editorPanelState={editorPanelState} />}
      libraryPanel={
        <BgModeLibraryPanel libraryPanelState={libraryPanelState} />
      }
    />
  );
};
