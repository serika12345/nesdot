import * as O from "fp-ts/Option";
import { useMemo } from "react";
import type {
  CharacterDecompositionAnalysis,
  CharacterDecompositionRegion,
  CharacterDecompositionRegionAnalysis,
} from "../../../../domain/characters/characterDecomposition";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import {
  useProjectState,
  type ProjectState,
} from "../../../../application/state/projectStore";
import {
  selectDecompositionCanvasCursor,
  selectDecompositionInvalidRegionCount,
  selectDecompositionRegionContextMenu,
  selectDecompositionValidRegionCount,
  selectSelectedRegionAnalysis,
} from "./characterModeSelectors";
import {
  useActiveSet,
  useDecompositionAnalysisDerived,
} from "./characterModeShared";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";

export const useCharacterModeDecompositionTool = (): Readonly<{
  decompositionTool: "pen" | "eraser" | "region";
  handleDecompositionToolChange: (tool: "pen" | "eraser" | "region") => void;
  projectSpriteSize: 8 | 16;
}> => {
  const decompositionTool = useCharacterModeDecompositionStore(
    (s) => s.decompositionTool,
  );
  const projectSpriteSize = useProjectState((s) => s.spriteSize);

  return {
    decompositionTool,
    handleDecompositionToolChange:
      useCharacterModeDecompositionStore.getState().setDecompositionTool,
    projectSpriteSize,
  };
};

export const useCharacterModeDecompositionPalette = (): Readonly<{
  decompositionColorIndex: 1 | 2 | 3;
  decompositionPaletteIndex: 0 | 1 | 2 | 3;
  handleDecompositionColorSlotSelect: (slotIndex: 1 | 2 | 3) => void;
  handleDecompositionPaletteSelect: (value: string | number) => void;
  spritePalettes: ProjectState["nes"]["spritePalettes"];
}> => {
  const decompositionColorIndex = useCharacterModeDecompositionStore(
    (s) => s.decompositionColorIndex,
  );
  const decompositionPaletteIndex = useCharacterModeDecompositionStore(
    (s) => s.decompositionPaletteIndex,
  );
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);

  return {
    decompositionColorIndex,
    decompositionPaletteIndex,
    handleDecompositionColorSlotSelect:
      useCharacterModeDecompositionStore.getState()
        .handleDecompositionColorSlotSelect,
    handleDecompositionPaletteSelect:
      useCharacterModeDecompositionStore.getState()
        .handleDecompositionPaletteSelect,
    spritePalettes,
  };
};

export const useCharacterModeDecompositionCanvasState = (): Readonly<{
  decompositionCanvasCursor: string;
}> => {
  const decompositionTool = useCharacterModeDecompositionStore(
    (s) => s.decompositionTool,
  );

  return {
    decompositionCanvasCursor:
      selectDecompositionCanvasCursor(decompositionTool),
  };
};

export const useCharacterModeDecompositionRegions = (): Readonly<{
  decompositionAnalysis: CharacterDecompositionAnalysis;
  decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>;
  handleSelectRegion: (regionId: string) => void;
  selectedRegionId: O.Option<string>;
}> => {
  const decompositionRegions = useCharacterModeDecompositionStore(
    (s) => s.decompositionRegions,
  );
  const selectedRegionId = useCharacterModeDecompositionStore(
    (s) => s.selectedRegionId,
  );
  const decompositionAnalysis = useDecompositionAnalysisDerived();

  return {
    decompositionAnalysis,
    decompositionRegions,
    handleSelectRegion:
      useCharacterModeDecompositionStore.getState().handleSelectRegion,
    selectedRegionId,
  };
};

export const useCharacterModeDecompositionRegionMenuState = (): Readonly<{
  closeDecompositionRegionContextMenu: () => void;
  decompositionRegionContextMenu: O.Option<{
    clientX: number;
    clientY: number;
    regionId: string;
  }>;
}> => {
  const editorMode = useCharacterModeProjectStore((s) => s.editorMode);
  const menuState = useCharacterModeDecompositionStore(
    (s) => s.decompositionRegionContextMenuState,
  );
  const decompositionAnalysis = useDecompositionAnalysisDerived();

  const decompositionRegionContextMenu = useMemo(
    () =>
      selectDecompositionRegionContextMenu(
        editorMode,
        menuState,
        decompositionAnalysis,
      ),
    [decompositionAnalysis, editorMode, menuState],
  );

  return {
    closeDecompositionRegionContextMenu:
      useCharacterModeDecompositionStore.getState()
        .closeDecompositionRegionContextMenu,
    decompositionRegionContextMenu,
  };
};

export const useCharacterModeDecompositionRegionMenuActions = (): Readonly<{
  handleDeleteContextMenuRegion: (regionId: string) => void;
}> => ({
  handleDeleteContextMenuRegion:
    useCharacterModeDecompositionStore.getState().handleDeleteContextMenuRegion,
});

export const useCharacterModeDecompositionOverview = (): Readonly<{
  activeSet: O.Option<CharacterSet>;
  decompositionAnalysis: CharacterDecompositionAnalysis;
  decompositionInvalidRegionCount: number;
  decompositionValidRegionCount: number;
  handleApplyDecomposition: () => boolean;
}> => {
  const activeSet = useActiveSet();
  const decompositionAnalysis = useDecompositionAnalysisDerived();

  return {
    activeSet,
    decompositionAnalysis,
    decompositionInvalidRegionCount: selectDecompositionInvalidRegionCount(
      decompositionAnalysis,
    ),
    decompositionValidRegionCount: selectDecompositionValidRegionCount(
      decompositionAnalysis,
    ),
    handleApplyDecomposition:
      useCharacterModeDecompositionStore.getState().handleApplyDecomposition,
  };
};

export const useCharacterModeSelectedRegion = (): Readonly<{
  handleRemoveSelectedRegion: () => void;
  selectedRegionAnalysis: O.Option<CharacterDecompositionRegionAnalysis>;
  selectedRegionId: O.Option<string>;
}> => {
  const selectedRegionId = useCharacterModeDecompositionStore(
    (s) => s.selectedRegionId,
  );
  const decompositionAnalysis = useDecompositionAnalysisDerived();
  const selectedRegionAnalysis = useMemo(
    () => selectSelectedRegionAnalysis(selectedRegionId, decompositionAnalysis),
    [decompositionAnalysis, selectedRegionId],
  );

  return {
    handleRemoveSelectedRegion:
      useCharacterModeDecompositionStore.getState().handleRemoveSelectedRegion,
    selectedRegionAnalysis,
    selectedRegionId,
  };
};
