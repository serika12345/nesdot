import React from "react";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
  useProjectState,
} from "../../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../../application/state/workbenchStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
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

const DEFAULT_BG_PALETTE: NesSubPalette = [0, 0, 0, 0];

const toPaletteIndex = (index: number): PaletteIndex | false => {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }

  return false;
};

const resolveActivePalette = (
  backgroundPalettes: ReadonlyArray<NesSubPalette>,
  activePaletteIndex: PaletteIndex,
): NesSubPalette =>
  backgroundPalettes[activePaletteIndex] ?? DEFAULT_BG_PALETTE;

const resolveBgSlotColorIndices = (
  activePalette: NesSubPalette,
  universalBackgroundColor: NesColorIndex,
): ReadonlyArray<NesColorIndex> =>
  activePalette.map((colorIndex, slotIndex) =>
    slotIndex === 0 ? universalBackgroundColor : colorIndex,
  );

/**
 * bgMode の state と UI を接続する画面境界です。
 * store から読む値をここで panel 単位へ分配し、子コンポーネントは focused props だけを受け取ります。
 */
export const BgModeScreen: React.FC = () => {
  const activePaletteIndex = useWorkbenchState(
    (state) => state.bgMode.activePaletteIndex,
  );
  const activeSlot = useWorkbenchState((state) => state.bgMode.activeSlot);
  const isToolMenuOpen = useWorkbenchState(
    (state) => state.bgMode.isToolMenuOpen,
  );
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );
  const setActivePaletteIndex = useWorkbenchState(
    (state) => state.setBgModeActivePaletteIndex,
  );
  const setActiveSlot = useWorkbenchState((state) => state.setBgModeActiveSlot);
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
  const {
    handleFlushPaint,
    handlePaintPixel,
    selectedTile,
    visibleBackgroundTiles,
  } = useBgModeTileEditorState();
  const deferredVisibleBackgroundTiles = React.useDeferredValue(
    visibleBackgroundTiles,
  );
  const activePalette = React.useMemo(
    () => resolveActivePalette(backgroundPalettes, activePaletteIndex),
    [activePaletteIndex, backgroundPalettes],
  );
  const slotColorIndices = React.useMemo(
    () => resolveBgSlotColorIndices(activePalette, universalBackgroundColor),
    [activePalette, universalBackgroundColor],
  );

  const handleToolMenuToggle = React.useCallback((): void => {
    setIsToolMenuOpen(isToolMenuOpen === false);
  }, [isToolMenuOpen, setIsToolMenuOpen]);

  const handlePaletteChange = React.useCallback(
    (value: string): void => {
      const nextIndex = Number.parseInt(value, 10);
      const paletteIndex = toPaletteIndex(nextIndex);

      if (paletteIndex === false) {
        return;
      }

      setActivePaletteIndex(paletteIndex);
    },
    [setActivePaletteIndex],
  );

  const handleSlotClick = React.useCallback(
    (slot: ColorIndexOfPalette): void => {
      setActiveSlot(slot);
    },
    [setActiveSlot],
  );

  const editorPanelState: BgModeEditorPanelState = {
    canvasState: {
      activePaletteIndex,
      activeSlot,
      backgroundPalettes,
      handleFlushPaint,
      handlePaintPixel,
      selectedTile,
      slotColorIndices,
      universalBackgroundColor,
    },
    handleToolMenuToggle,
    isToolMenuOpen,
    paletteState: {
      activePaletteIndex,
      activeSlot,
      backgroundPalettes,
      handlePaletteChange,
      handleSlotClick,
      slotColorIndices,
    },
    toolMenuState: {
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
