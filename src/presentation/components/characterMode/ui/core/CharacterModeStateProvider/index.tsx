import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { CHARACTER_MODE_STAGE_LIMITS } from "../../../logic/hooks/characterModeConstants";
import {
  type CharacterModeComposeSection,
  type CharacterModeDecompositionSection,
  type CharacterModeLibrarySection,
  type CharacterModeProjectSection,
  type CharacterModeStageSection,
  type CharacterModeState,
  type CharacterModeWorkspaceSection,
} from "../../../logic/hooks/characterModeStateTypes";
import { useCharacterModeInternalState } from "../../../logic/hooks/useCharacterModeState";

const noop = (): void => {};
const noopBoolean = (): boolean => false;
const noopString = (value: string): void => {
  void value;
};
const noopNumber = (value: number): void => {
  void value;
};
const noopPointerDiv: React.PointerEventHandler<HTMLDivElement> = () => {};
const noopMouseDiv: React.MouseEventHandler<HTMLDivElement> = () => {};
const noopWheelDiv: React.WheelEventHandler<HTMLDivElement> = () => {};
const noopKeyboardDiv: React.KeyboardEventHandler<HTMLDivElement> = () => {};
const noopDivRef = (element: HTMLDivElement | null): void => {
  void element;
};
const noopCanvasRef = (element: HTMLCanvasElement | null): void => {
  void element;
};
const noopSpriteSize = (value: 8 | 16): void => {
  void value;
};
const noopEditorMode = (value: "compose" | "decompose"): void => {
  void value;
};
const noopDecompositionTool = (value: "pen" | "eraser" | "region"): void => {
  void value;
};
const noopPointerButton = (
  event: React.PointerEvent<HTMLButtonElement>,
  value: number,
): void => {
  void event;
  void value;
};
const noopRegionPointer = (
  event: React.PointerEvent<HTMLButtonElement>,
  region: { id: string; x: number; y: number },
): void => {
  void event;
  void region;
};
const noopRegionContextMenu = (
  event: React.MouseEvent<HTMLButtonElement>,
  region: { id: string; x: number; y: number },
): void => {
  void event;
  void region;
};

const CharacterModeStateContext = React.createContext<
  O.Option<CharacterModeState>
>(O.none);

const useCharacterModeSlice = <T,>(
  pick: (state: CharacterModeState) => T,
  fallback: T,
): T => {
  const state = React.useContext(CharacterModeStateContext);

  return pipe(
    state,
    O.match(
      () => fallback,
      (value) => pick(value),
    ),
  );
};

interface CharacterModeStateProviderProps {
  children: React.ReactNode;
}

export const CharacterModeStateProvider: React.FC<
  CharacterModeStateProviderProps
> = ({ children }) => {
  const value = useCharacterModeInternalState();

  return (
    <CharacterModeStateContext.Provider value={O.some(value)}>
      {children}
    </CharacterModeStateContext.Provider>
  );
};

type CharacterModeProjectActionsSlice = Pick<
  CharacterModeProjectSection,
  "projectActions"
>;

const defaultCharacterModeProjectActions: CharacterModeProjectActionsSlice = {
  projectActions: [],
};

export const useCharacterModeProjectActions =
  (): CharacterModeProjectActionsSlice =>
    useCharacterModeSlice(
      (state) => ({
        projectActions: state.project.projectActions,
      }),
      defaultCharacterModeProjectActions,
    );

type CharacterModeWorkspaceEventsSlice = CharacterModeWorkspaceSection;

const defaultCharacterModeWorkspaceEvents: CharacterModeWorkspaceEventsSlice = {
  handleWorkspacePointerDownCapture: noopPointerDiv,
  handleWorkspacePointerEnd: noopPointerDiv,
  handleWorkspacePointerMove: noopPointerDiv,
};

export const useCharacterModeWorkspaceEvents =
  (): CharacterModeWorkspaceEventsSlice =>
    useCharacterModeSlice(
      (state) => state.workspace,
      defaultCharacterModeWorkspaceEvents,
    );

type CharacterModeEditorModeValueSlice = Readonly<{
  editorMode: CharacterModeProjectSection["editorMode"]["value"];
}>;

const defaultCharacterModeEditorModeValue: CharacterModeEditorModeValueSlice = {
  editorMode: "compose",
};

export const useCharacterModeEditorModeValue =
  (): CharacterModeEditorModeValueSlice =>
    useCharacterModeSlice(
      (state) => ({
        editorMode: state.project.editorMode.value,
      }),
      defaultCharacterModeEditorModeValue,
    );

type CharacterModeSpriteMenuStateSlice = Readonly<{
  closeSpriteContextMenu: CharacterModeComposeSection["spriteMenu"]["closeSpriteContextMenu"];
  handleComposeContextMenu: CharacterModeComposeSection["handleComposeContextMenu"];
  spriteContextMenu: CharacterModeComposeSection["spriteMenu"]["spriteContextMenu"];
}>;

const defaultCharacterModeSpriteMenuState: CharacterModeSpriteMenuStateSlice = {
  closeSpriteContextMenu: noop,
  handleComposeContextMenu: noopMouseDiv,
  spriteContextMenu: O.none,
};

export const useCharacterModeSpriteMenuState =
  (): CharacterModeSpriteMenuStateSlice =>
    useCharacterModeSlice(
      (state) => ({
        closeSpriteContextMenu: state.compose.spriteMenu.closeSpriteContextMenu,
        handleComposeContextMenu: state.compose.handleComposeContextMenu,
        spriteContextMenu: state.compose.spriteMenu.spriteContextMenu,
      }),
      defaultCharacterModeSpriteMenuState,
    );

type CharacterModeSpriteMenuActionsSlice = Readonly<{
  focusStageElement: CharacterModeStageSection["focusStageElement"];
  handleDeleteContextMenuSprite: CharacterModeComposeSection["spriteMenu"]["handleDeleteContextMenuSprite"];
  handleShiftContextMenuSpriteLayer: CharacterModeComposeSection["spriteMenu"]["handleShiftContextMenuSpriteLayer"];
}>;

const defaultCharacterModeSpriteMenuActions: CharacterModeSpriteMenuActionsSlice =
  {
    focusStageElement: noop,
    handleDeleteContextMenuSprite: noopNumber,
    handleShiftContextMenuSpriteLayer: (
      spriteIndex: number,
      delta: number,
    ): void => {
      void spriteIndex;
      void delta;
    },
  };

export const useCharacterModeSpriteMenuActions =
  (): CharacterModeSpriteMenuActionsSlice =>
    useCharacterModeSlice(
      (state) => ({
        focusStageElement: state.stage.focusStageElement,
        handleDeleteContextMenuSprite:
          state.compose.spriteMenu.handleDeleteContextMenuSprite,
        handleShiftContextMenuSpriteLayer:
          state.compose.spriteMenu.handleShiftContextMenuSpriteLayer,
      }),
      defaultCharacterModeSpriteMenuActions,
    );

type CharacterModeSetDraftSlice = Readonly<{
  handleCreateSet: CharacterModeProjectSection["setDraft"]["handleCreateSet"];
  handleNewNameChange: CharacterModeProjectSection["setDraft"]["handleNewNameChange"];
  newName: CharacterModeProjectSection["setDraft"]["newName"];
}>;

const defaultCharacterModeSetDraft: CharacterModeSetDraftSlice = {
  handleCreateSet: noop,
  handleNewNameChange: noopString,
  newName: "",
};

export const useCharacterModeSetDraft = (): CharacterModeSetDraftSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleCreateSet: state.project.setDraft.handleCreateSet,
      handleNewNameChange: state.project.setDraft.handleNewNameChange,
      newName: state.project.setDraft.newName,
    }),
    defaultCharacterModeSetDraft,
  );

type CharacterModeSetSelectionSlice = Readonly<{
  characterSets: CharacterModeProjectSection["characterSets"];
  handleDeleteSet: CharacterModeProjectSection["setSelection"]["handleDeleteSet"];
  handleSelectSet: CharacterModeProjectSection["setSelection"]["handleSelectSet"];
  selectedCharacterId: CharacterModeProjectSection["selectedCharacterId"];
}>;

const defaultCharacterModeSetSelection: CharacterModeSetSelectionSlice = {
  characterSets: [],
  handleDeleteSet: noopString,
  handleSelectSet: noopString,
  selectedCharacterId: O.none,
};

export const useCharacterModeSetSelection =
  (): CharacterModeSetSelectionSlice =>
    useCharacterModeSlice(
      (state) => ({
        characterSets: state.project.characterSets,
        handleDeleteSet: state.project.setSelection.handleDeleteSet,
        handleSelectSet: state.project.setSelection.handleSelectSet,
        selectedCharacterId: state.project.selectedCharacterId,
      }),
      defaultCharacterModeSetSelection,
    );

type CharacterModeSetNameSlice = Readonly<{
  activeSet: CharacterModeProjectSection["activeSet"];
  activeSetName: CharacterModeProjectSection["activeSetName"];
  handleSetNameChange: CharacterModeProjectSection["setNaming"]["handleSetNameChange"];
}>;

const defaultCharacterModeSetName: CharacterModeSetNameSlice = {
  activeSet: O.none,
  activeSetName: "",
  handleSetNameChange: noopString,
};

export const useCharacterModeSetName = (): CharacterModeSetNameSlice =>
  useCharacterModeSlice(
    (state) => ({
      activeSet: state.project.activeSet,
      activeSetName: state.project.activeSetName,
      handleSetNameChange: state.project.setNaming.handleSetNameChange,
    }),
    defaultCharacterModeSetName,
  );

type CharacterModeEditorModeSettingSlice = Readonly<{
  editorMode: CharacterModeProjectSection["editorMode"]["value"];
  handleEditorModeChange: CharacterModeProjectSection["editorMode"]["handleChange"];
}>;

const defaultCharacterModeEditorModeSetting: CharacterModeEditorModeSettingSlice =
  {
    editorMode: "compose",
    handleEditorModeChange: noopEditorMode,
  };

export const useCharacterModeEditorModeSetting =
  (): CharacterModeEditorModeSettingSlice =>
    useCharacterModeSlice(
      (state) => ({
        editorMode: state.project.editorMode.value,
        handleEditorModeChange: state.project.editorMode.handleChange,
      }),
      defaultCharacterModeEditorModeSetting,
    );

type CharacterModeSpriteSizeSlice = Readonly<{
  handleProjectSpriteSizeChange: CharacterModeProjectSection["spriteSize"]["handleProjectSpriteSizeChange"];
  projectSpriteSize: CharacterModeProjectSection["spriteSize"]["projectSpriteSize"];
  projectSpriteSizeLocked: CharacterModeProjectSection["spriteSize"]["projectSpriteSizeLocked"];
}>;

const defaultCharacterModeSpriteSize: CharacterModeSpriteSizeSlice = {
  handleProjectSpriteSizeChange: noopSpriteSize,
  projectSpriteSize: 8,
  projectSpriteSizeLocked: false,
};

export const useCharacterModeSpriteSize = (): CharacterModeSpriteSizeSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleProjectSpriteSizeChange:
        state.project.spriteSize.handleProjectSpriteSizeChange,
      projectSpriteSize: state.project.spriteSize.projectSpriteSize,
      projectSpriteSizeLocked: state.project.spriteSize.projectSpriteSizeLocked,
    }),
    defaultCharacterModeSpriteSize,
  );

type CharacterModeSpriteLibrarySlice = Readonly<{
  draggingSpriteIndex: number;
  handleLibraryPointerDown: CharacterModeLibrarySection["handleLibraryPointerDown"];
  isLibraryDraggable: boolean;
  sprites: CharacterModeLibrarySection["sprites"];
}>;

const defaultCharacterModeSpriteLibrary: CharacterModeSpriteLibrarySlice = {
  draggingSpriteIndex: -1,
  handleLibraryPointerDown: noopPointerButton,
  isLibraryDraggable: false,
  sprites: [],
};

export const useCharacterModeSpriteLibrary =
  (): CharacterModeSpriteLibrarySlice =>
    useCharacterModeSlice(
      (state) => ({
        draggingSpriteIndex: pipe(
          state.library.libraryDragState,
          O.match(
            () => -1,
            (dragState) => dragState.spriteIndex,
          ),
        ),
        handleLibraryPointerDown: state.library.handleLibraryPointerDown,
        isLibraryDraggable: state.library.isLibraryDraggable,
        sprites: state.library.sprites,
      }),
      defaultCharacterModeSpriteLibrary,
    );

type CharacterModeStageDisplaySlice = Readonly<{
  activeSetName: CharacterModeStageSection["activeSetName"];
  activeSetSpriteCount: CharacterModeStageSection["activeSetSpriteCount"];
  isStageDropActive: CharacterModeStageSection["isStageDropActive"];
  selectedSpriteStageMetadata: CharacterModeStageSection["selectedSpriteStageMetadata"];
}>;

const defaultCharacterModeStageDisplay: CharacterModeStageDisplaySlice = {
  activeSetName: "",
  activeSetSpriteCount: 0,
  isStageDropActive: false,
  selectedSpriteStageMetadata: {
    index: "",
    layer: "",
    x: "",
    y: "",
  },
};

export const useCharacterModeStageDisplay =
  (): CharacterModeStageDisplaySlice =>
    useCharacterModeSlice(
      (state) => ({
        activeSetName: state.stage.activeSetName,
        activeSetSpriteCount: state.stage.activeSetSpriteCount,
        isStageDropActive: state.stage.isStageDropActive,
        selectedSpriteStageMetadata: state.stage.selectedSpriteStageMetadata,
      }),
      defaultCharacterModeStageDisplay,
    );

type CharacterModeStageSizeSlice = Readonly<{
  handleStageHeightChange: CharacterModeStageSection["handleStageHeightChange"];
  handleStageWidthChange: CharacterModeStageSection["handleStageWidthChange"];
  stageHeight: CharacterModeStageSection["stageHeight"];
  stageScale: CharacterModeStageSection["stageScale"];
  stageWidth: CharacterModeStageSection["stageWidth"];
}>;

const defaultCharacterModeStageSize: CharacterModeStageSizeSlice = {
  handleStageHeightChange: noopString,
  handleStageWidthChange: noopString,
  stageHeight: CHARACTER_MODE_STAGE_LIMITS.initialHeight,
  stageScale: 1,
  stageWidth: CHARACTER_MODE_STAGE_LIMITS.initialWidth,
};

export const useCharacterModeStageSize = (): CharacterModeStageSizeSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleStageHeightChange: state.stage.handleStageHeightChange,
      handleStageWidthChange: state.stage.handleStageWidthChange,
      stageHeight: state.stage.stageHeight,
      stageScale: state.stage.stageScale,
      stageWidth: state.stage.stageWidth,
    }),
    defaultCharacterModeStageSize,
  );

type CharacterModeStageZoomSlice = Readonly<{
  handleZoomIn: CharacterModeStageSection["handleZoomIn"];
  handleZoomOut: CharacterModeStageSection["handleZoomOut"];
  stageZoomLevel: CharacterModeStageSection["stageZoomLevel"];
}>;

const defaultCharacterModeStageZoom: CharacterModeStageZoomSlice = {
  handleZoomIn: noop,
  handleZoomOut: noop,
  stageZoomLevel: CHARACTER_MODE_STAGE_LIMITS.defaultZoomLevel,
};

export const useCharacterModeStageZoom = (): CharacterModeStageZoomSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleZoomIn: state.stage.handleZoomIn,
      handleZoomOut: state.stage.handleZoomOut,
      stageZoomLevel: state.stage.stageZoomLevel,
    }),
    defaultCharacterModeStageZoom,
  );

type CharacterModeStageViewportSlice = Readonly<{
  handleViewportPointerDown: CharacterModeStageSection["handleViewportPointerDown"];
  handleViewportPointerEnd: CharacterModeStageSection["handleViewportPointerEnd"];
  handleViewportPointerMove: CharacterModeStageSection["handleViewportPointerMove"];
  handleViewportRef: CharacterModeStageSection["handleViewportRef"];
  handleViewportWheel: CharacterModeStageSection["handleViewportWheel"];
}>;

const defaultCharacterModeStageViewport: CharacterModeStageViewportSlice = {
  handleViewportPointerDown: noopPointerDiv,
  handleViewportPointerEnd: noopPointerDiv,
  handleViewportPointerMove: noopPointerDiv,
  handleViewportRef: noopDivRef,
  handleViewportWheel: noopWheelDiv,
};

export const useCharacterModeStageViewport =
  (): CharacterModeStageViewportSlice =>
    useCharacterModeSlice(
      (state) => ({
        handleViewportPointerDown: state.stage.handleViewportPointerDown,
        handleViewportPointerEnd: state.stage.handleViewportPointerEnd,
        handleViewportPointerMove: state.stage.handleViewportPointerMove,
        handleViewportRef: state.stage.handleViewportRef,
        handleViewportWheel: state.stage.handleViewportWheel,
      }),
      defaultCharacterModeStageViewport,
    );

type CharacterModeViewportPanSlice = Readonly<{
  viewportPanState: CharacterModeStageSection["viewportPanState"];
}>;

const defaultCharacterModeViewportPan: CharacterModeViewportPanSlice = {
  viewportPanState: O.none,
};

export const useCharacterModeViewportPan = (): CharacterModeViewportPanSlice =>
  useCharacterModeSlice(
    (state) => ({
      viewportPanState: state.stage.viewportPanState,
    }),
    defaultCharacterModeViewportPan,
  );

type CharacterModeComposeCanvasSlice = Readonly<{
  getSpriteTile: CharacterModeLibrarySection["getSpriteTile"];
  handleComposeCanvasRef: CharacterModeComposeSection["handleComposeCanvasRef"];
  handleComposeContextMenu: CharacterModeComposeSection["handleComposeContextMenu"];
  handleStageKeyDown: CharacterModeComposeSection["handleStageKeyDown"];
  handleStageRef: CharacterModeStageSection["handleStageRef"];
}>;

const defaultCharacterModeComposeCanvas: CharacterModeComposeCanvasSlice = {
  getSpriteTile: (spriteIndex: number) => {
    void spriteIndex;
    return O.none;
  },
  handleComposeCanvasRef: noopCanvasRef,
  handleComposeContextMenu: noopMouseDiv,
  handleStageKeyDown: noopKeyboardDiv,
  handleStageRef: noopDivRef,
};

export const useCharacterModeComposeCanvas =
  (): CharacterModeComposeCanvasSlice =>
    useCharacterModeSlice(
      (state) => ({
        getSpriteTile: state.library.getSpriteTile,
        handleComposeCanvasRef: state.compose.handleComposeCanvasRef,
        handleComposeContextMenu: state.compose.handleComposeContextMenu,
        handleStageKeyDown: state.compose.handleStageKeyDown,
        handleStageRef: state.stage.handleStageRef,
      }),
      defaultCharacterModeComposeCanvas,
    );

type CharacterModeLibraryDragPreviewSlice = Readonly<{
  getSpriteTile: CharacterModeLibrarySection["getSpriteTile"];
  libraryDragState: CharacterModeLibrarySection["libraryDragState"];
  stageScale: CharacterModeStageSection["stageScale"];
}>;

const defaultCharacterModeLibraryDragPreview: CharacterModeLibraryDragPreviewSlice =
  {
    getSpriteTile: (spriteIndex: number) => {
      void spriteIndex;
      return O.none;
    },
    libraryDragState: O.none,
    stageScale: 1,
  };

export const useCharacterModeLibraryDragPreview =
  (): CharacterModeLibraryDragPreviewSlice =>
    useCharacterModeSlice(
      (state) => ({
        getSpriteTile: state.library.getSpriteTile,
        libraryDragState: state.library.libraryDragState,
        stageScale: state.stage.stageScale,
      }),
      defaultCharacterModeLibraryDragPreview,
    );

type CharacterModeDecompositionToolSlice = Readonly<{
  decompositionTool: CharacterModeDecompositionSection["tool"]["decompositionTool"];
  handleDecompositionToolChange: CharacterModeDecompositionSection["tool"]["handleDecompositionToolChange"];
  projectSpriteSize: CharacterModeDecompositionSection["tool"]["projectSpriteSize"];
}>;

const defaultCharacterModeDecompositionTool: CharacterModeDecompositionToolSlice =
  {
    decompositionTool: "pen",
    handleDecompositionToolChange: noopDecompositionTool,
    projectSpriteSize: 8,
  };

export const useCharacterModeDecompositionTool =
  (): CharacterModeDecompositionToolSlice =>
    useCharacterModeSlice(
      (state) => ({
        decompositionTool: state.decomposition.tool.decompositionTool,
        handleDecompositionToolChange:
          state.decomposition.tool.handleDecompositionToolChange,
        projectSpriteSize: state.decomposition.tool.projectSpriteSize,
      }),
      defaultCharacterModeDecompositionTool,
    );

type CharacterModeDecompositionPaletteSlice = Readonly<{
  decompositionColorIndex: CharacterModeDecompositionSection["palette"]["decompositionColorIndex"];
  decompositionPaletteIndex: CharacterModeDecompositionSection["palette"]["decompositionPaletteIndex"];
  handleDecompositionColorSlotSelect: CharacterModeDecompositionSection["palette"]["handleDecompositionColorSlotSelect"];
  handleDecompositionPaletteSelect: CharacterModeDecompositionSection["palette"]["handleDecompositionPaletteSelect"];
  spritePalettes: CharacterModeDecompositionSection["palette"]["spritePalettes"];
}>;

const defaultCharacterModeDecompositionPalette: CharacterModeDecompositionPaletteSlice =
  {
    decompositionColorIndex: 1,
    decompositionPaletteIndex: 0,
    handleDecompositionColorSlotSelect: (value: 1 | 2 | 3) => {
      void value;
    },
    handleDecompositionPaletteSelect: (value: string | number) => {
      void value;
    },
    spritePalettes: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  };

export const useCharacterModeDecompositionPalette =
  (): CharacterModeDecompositionPaletteSlice =>
    useCharacterModeSlice(
      (state) => ({
        decompositionColorIndex:
          state.decomposition.palette.decompositionColorIndex,
        decompositionPaletteIndex:
          state.decomposition.palette.decompositionPaletteIndex,
        handleDecompositionColorSlotSelect:
          state.decomposition.palette.handleDecompositionColorSlotSelect,
        handleDecompositionPaletteSelect:
          state.decomposition.palette.handleDecompositionPaletteSelect,
        spritePalettes: state.decomposition.palette.spritePalettes,
      }),
      defaultCharacterModeDecompositionPalette,
    );

type CharacterModeDecompositionCanvasSlice = Readonly<{
  decompositionCanvasCursor: CharacterModeDecompositionSection["canvas"]["decompositionCanvasCursor"];
  handleDecompositionCanvasPointerDown: CharacterModeDecompositionSection["canvas"]["handleDecompositionCanvasPointerDown"];
  handleDecompositionCanvasRef: CharacterModeDecompositionSection["canvas"]["handleDecompositionCanvasRef"];
  handleStageRef: CharacterModeStageSection["handleStageRef"];
}>;

const defaultCharacterModeDecompositionCanvas: CharacterModeDecompositionCanvasSlice =
  {
    decompositionCanvasCursor: "crosshair",
    handleDecompositionCanvasPointerDown: (
      event: React.PointerEvent<HTMLCanvasElement>,
    ) => {
      void event;
    },
    handleDecompositionCanvasRef: noopCanvasRef,
    handleStageRef: noopDivRef,
  };

export const useCharacterModeDecompositionCanvas =
  (): CharacterModeDecompositionCanvasSlice =>
    useCharacterModeSlice(
      (state) => ({
        decompositionCanvasCursor:
          state.decomposition.canvas.decompositionCanvasCursor,
        handleDecompositionCanvasPointerDown:
          state.decomposition.canvas.handleDecompositionCanvasPointerDown,
        handleDecompositionCanvasRef:
          state.decomposition.canvas.handleDecompositionCanvasRef,
        handleStageRef: state.stage.handleStageRef,
      }),
      defaultCharacterModeDecompositionCanvas,
    );

type CharacterModeDecompositionRegionsSlice = Readonly<{
  decompositionAnalysis: CharacterModeDecompositionSection["regions"]["decompositionAnalysis"];
  decompositionRegions: CharacterModeDecompositionSection["regions"]["decompositionRegions"];
  handleDecompositionRegionContextMenu: CharacterModeDecompositionSection["regions"]["handleDecompositionRegionContextMenu"];
  handleDecompositionRegionPointerDown: CharacterModeDecompositionSection["regions"]["handleDecompositionRegionPointerDown"];
  handleSelectRegion: CharacterModeDecompositionSection["regions"]["handleSelectRegion"];
  selectedRegionId: CharacterModeDecompositionSection["regions"]["selectedRegionId"];
}>;

const defaultCharacterModeDecompositionRegions: CharacterModeDecompositionRegionsSlice =
  {
    decompositionAnalysis: {
      spriteSize: 8,
      regions: [],
      reusableSpriteCount: 0,
      requiredNewSpriteCount: 0,
      availableEmptySlotCount: 0,
      canApply: false,
    },
    decompositionRegions: [],
    handleDecompositionRegionContextMenu: noopRegionContextMenu,
    handleDecompositionRegionPointerDown: noopRegionPointer,
    handleSelectRegion: noopString,
    selectedRegionId: O.none,
  };

export const useCharacterModeDecompositionRegions =
  (): CharacterModeDecompositionRegionsSlice =>
    useCharacterModeSlice(
      (state) => ({
        decompositionAnalysis:
          state.decomposition.regions.decompositionAnalysis,
        decompositionRegions: state.decomposition.regions.decompositionRegions,
        handleDecompositionRegionContextMenu:
          state.decomposition.regions.handleDecompositionRegionContextMenu,
        handleDecompositionRegionPointerDown:
          state.decomposition.regions.handleDecompositionRegionPointerDown,
        handleSelectRegion: state.decomposition.regions.handleSelectRegion,
        selectedRegionId: state.decomposition.regions.selectedRegionId,
      }),
      defaultCharacterModeDecompositionRegions,
    );

type CharacterModeDecompositionRegionMenuStateSlice = Readonly<{
  closeDecompositionRegionContextMenu: CharacterModeDecompositionSection["regionMenu"]["closeDecompositionRegionContextMenu"];
  decompositionRegionContextMenu: CharacterModeDecompositionSection["regionMenu"]["decompositionRegionContextMenu"];
}>;

const defaultCharacterModeDecompositionRegionMenuState: CharacterModeDecompositionRegionMenuStateSlice =
  {
    closeDecompositionRegionContextMenu: noop,
    decompositionRegionContextMenu: O.none,
  };

export const useCharacterModeDecompositionRegionMenuState =
  (): CharacterModeDecompositionRegionMenuStateSlice =>
    useCharacterModeSlice(
      (state) => ({
        closeDecompositionRegionContextMenu:
          state.decomposition.regionMenu.closeDecompositionRegionContextMenu,
        decompositionRegionContextMenu:
          state.decomposition.regionMenu.decompositionRegionContextMenu,
      }),
      defaultCharacterModeDecompositionRegionMenuState,
    );

type CharacterModeDecompositionRegionMenuActionsSlice = Readonly<{
  focusStageElement: CharacterModeStageSection["focusStageElement"];
  handleDeleteContextMenuRegion: CharacterModeDecompositionSection["regionMenu"]["handleDeleteContextMenuRegion"];
}>;

const defaultCharacterModeDecompositionRegionMenuActions: CharacterModeDecompositionRegionMenuActionsSlice =
  {
    focusStageElement: noop,
    handleDeleteContextMenuRegion: noopString,
  };

export const useCharacterModeDecompositionRegionMenuActions =
  (): CharacterModeDecompositionRegionMenuActionsSlice =>
    useCharacterModeSlice(
      (state) => ({
        focusStageElement: state.stage.focusStageElement,
        handleDeleteContextMenuRegion:
          state.decomposition.regionMenu.handleDeleteContextMenuRegion,
      }),
      defaultCharacterModeDecompositionRegionMenuActions,
    );

type CharacterModeDecompositionOverviewSlice = Readonly<{
  activeSet: CharacterModeProjectSection["activeSet"];
  decompositionAnalysis: CharacterModeDecompositionSection["regions"]["decompositionAnalysis"];
  decompositionInvalidRegionCount: CharacterModeDecompositionSection["regions"]["decompositionInvalidRegionCount"];
  decompositionValidRegionCount: CharacterModeDecompositionSection["regions"]["decompositionValidRegionCount"];
  handleApplyDecomposition: CharacterModeDecompositionSection["regions"]["handleApplyDecomposition"];
}>;

const defaultCharacterModeDecompositionOverview: CharacterModeDecompositionOverviewSlice =
  {
    activeSet: O.none,
    decompositionAnalysis: {
      spriteSize: 8,
      regions: [],
      reusableSpriteCount: 0,
      requiredNewSpriteCount: 0,
      availableEmptySlotCount: 0,
      canApply: false,
    },
    decompositionInvalidRegionCount: 0,
    decompositionValidRegionCount: 0,
    handleApplyDecomposition: noopBoolean,
  };

export const useCharacterModeDecompositionOverview =
  (): CharacterModeDecompositionOverviewSlice =>
    useCharacterModeSlice(
      (state) => ({
        activeSet: state.project.activeSet,
        decompositionAnalysis:
          state.decomposition.regions.decompositionAnalysis,
        decompositionInvalidRegionCount:
          state.decomposition.regions.decompositionInvalidRegionCount,
        decompositionValidRegionCount:
          state.decomposition.regions.decompositionValidRegionCount,
        handleApplyDecomposition:
          state.decomposition.regions.handleApplyDecomposition,
      }),
      defaultCharacterModeDecompositionOverview,
    );

type CharacterModeSelectedRegionSlice = Readonly<{
  handleRemoveSelectedRegion: CharacterModeDecompositionSection["regions"]["handleRemoveSelectedRegion"];
  selectedRegionAnalysis: CharacterModeDecompositionSection["regions"]["selectedRegionAnalysis"];
  selectedRegionId: CharacterModeDecompositionSection["regions"]["selectedRegionId"];
}>;

const defaultCharacterModeSelectedRegion: CharacterModeSelectedRegionSlice = {
  handleRemoveSelectedRegion: noop,
  selectedRegionAnalysis: O.none,
  selectedRegionId: O.none,
};

export const useCharacterModeSelectedRegion =
  (): CharacterModeSelectedRegionSlice =>
    useCharacterModeSlice(
      (state) => ({
        handleRemoveSelectedRegion:
          state.decomposition.regions.handleRemoveSelectedRegion,
        selectedRegionAnalysis:
          state.decomposition.regions.selectedRegionAnalysis,
        selectedRegionId: state.decomposition.regions.selectedRegionId,
      }),
      defaultCharacterModeSelectedRegion,
    );
