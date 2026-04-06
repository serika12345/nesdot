import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import React from "react";
import {
  CHARACTER_MODE_STAGE_LIMITS,
  type CharacterModeState,
  useCharacterModeInternalState,
} from "./hooks/useCharacterModeState";

const noop = (): void => {};
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
  CharacterModeState,
  "projectActions"
>;

const defaultCharacterModeProjectActions: CharacterModeProjectActionsSlice = {
  projectActions: [],
};

export const useCharacterModeProjectActions =
  (): CharacterModeProjectActionsSlice =>
    useCharacterModeSlice(
      (state) => ({
        projectActions: state.projectActions,
      }),
      defaultCharacterModeProjectActions,
    );

type CharacterModeWorkspaceEventsSlice = Pick<
  CharacterModeState,
  | "handleWorkspacePointerDownCapture"
  | "handleWorkspacePointerEnd"
  | "handleWorkspacePointerMove"
>;

const defaultCharacterModeWorkspaceEvents: CharacterModeWorkspaceEventsSlice = {
  handleWorkspacePointerDownCapture: noopPointerDiv,
  handleWorkspacePointerEnd: noopPointerDiv,
  handleWorkspacePointerMove: noopPointerDiv,
};

export const useCharacterModeWorkspaceEvents =
  (): CharacterModeWorkspaceEventsSlice =>
    useCharacterModeSlice(
      (state) => ({
        handleWorkspacePointerDownCapture:
          state.handleWorkspacePointerDownCapture,
        handleWorkspacePointerEnd: state.handleWorkspacePointerEnd,
        handleWorkspacePointerMove: state.handleWorkspacePointerMove,
      }),
      defaultCharacterModeWorkspaceEvents,
    );

type CharacterModeEditorModeValueSlice = Pick<CharacterModeState, "editorMode">;

const defaultCharacterModeEditorModeValue: CharacterModeEditorModeValueSlice = {
  editorMode: "compose",
};

export const useCharacterModeEditorModeValue =
  (): CharacterModeEditorModeValueSlice =>
    useCharacterModeSlice(
      (state) => ({
        editorMode: state.editorMode,
      }),
      defaultCharacterModeEditorModeValue,
    );

type CharacterModeSpriteMenuStateSlice = Pick<
  CharacterModeState,
  "closeSpriteContextMenu" | "handleComposeContextMenu" | "spriteContextMenu"
>;

const defaultCharacterModeSpriteMenuState: CharacterModeSpriteMenuStateSlice = {
  closeSpriteContextMenu: noop,
  handleComposeContextMenu: noopMouseDiv,
  spriteContextMenu: O.none,
};

export const useCharacterModeSpriteMenuState =
  (): CharacterModeSpriteMenuStateSlice =>
    useCharacterModeSlice(
      (state) => ({
        closeSpriteContextMenu: state.closeSpriteContextMenu,
        handleComposeContextMenu: state.handleComposeContextMenu,
        spriteContextMenu: state.spriteContextMenu,
      }),
      defaultCharacterModeSpriteMenuState,
    );

type CharacterModeSpriteMenuActionsSlice = Pick<
  CharacterModeState,
  | "focusStageElement"
  | "handleDeleteContextMenuSprite"
  | "handleShiftContextMenuSpriteLayer"
>;

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
        focusStageElement: state.focusStageElement,
        handleDeleteContextMenuSprite: state.handleDeleteContextMenuSprite,
        handleShiftContextMenuSpriteLayer:
          state.handleShiftContextMenuSpriteLayer,
      }),
      defaultCharacterModeSpriteMenuActions,
    );

type CharacterModeSetDraftSlice = Pick<
  CharacterModeState,
  "handleCreateSet" | "handleNewNameChange" | "newName"
>;

const defaultCharacterModeSetDraft: CharacterModeSetDraftSlice = {
  handleCreateSet: noop,
  handleNewNameChange: noopString,
  newName: "",
};

export const useCharacterModeSetDraft = (): CharacterModeSetDraftSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleCreateSet: state.handleCreateSet,
      handleNewNameChange: state.handleNewNameChange,
      newName: state.newName,
    }),
    defaultCharacterModeSetDraft,
  );

type CharacterModeSetSelectionSlice = Pick<
  CharacterModeState,
  | "characterSets"
  | "handleDeleteSet"
  | "handleSelectSet"
  | "selectedCharacterId"
>;

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
        characterSets: state.characterSets,
        handleDeleteSet: state.handleDeleteSet,
        handleSelectSet: state.handleSelectSet,
        selectedCharacterId: state.selectedCharacterId,
      }),
      defaultCharacterModeSetSelection,
    );

type CharacterModeSetNameSlice = Pick<
  CharacterModeState,
  "activeSet" | "activeSetName" | "handleSetNameChange"
>;

const defaultCharacterModeSetName: CharacterModeSetNameSlice = {
  activeSet: O.none,
  activeSetName: "",
  handleSetNameChange: noopString,
};

export const useCharacterModeSetName = (): CharacterModeSetNameSlice =>
  useCharacterModeSlice(
    (state) => ({
      activeSet: state.activeSet,
      activeSetName: state.activeSetName,
      handleSetNameChange: state.handleSetNameChange,
    }),
    defaultCharacterModeSetName,
  );

type CharacterModeEditorModeSettingSlice = Pick<
  CharacterModeState,
  "editorMode" | "handleEditorModeChange"
>;

const defaultCharacterModeEditorModeSetting: CharacterModeEditorModeSettingSlice =
  {
    editorMode: "compose",
    handleEditorModeChange: noopEditorMode,
  };

export const useCharacterModeEditorModeSetting =
  (): CharacterModeEditorModeSettingSlice =>
    useCharacterModeSlice(
      (state) => ({
        editorMode: state.editorMode,
        handleEditorModeChange: state.handleEditorModeChange,
      }),
      defaultCharacterModeEditorModeSetting,
    );

type CharacterModeSpriteSizeSlice = Pick<
  CharacterModeState,
  | "handleProjectSpriteSizeChange"
  | "projectSpriteSize"
  | "projectSpriteSizeLocked"
>;

const defaultCharacterModeSpriteSize: CharacterModeSpriteSizeSlice = {
  handleProjectSpriteSizeChange: noopSpriteSize,
  projectSpriteSize: 8,
  projectSpriteSizeLocked: false,
};

export const useCharacterModeSpriteSize = (): CharacterModeSpriteSizeSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleProjectSpriteSizeChange: state.handleProjectSpriteSizeChange,
      projectSpriteSize: state.projectSpriteSize,
      projectSpriteSizeLocked: state.projectSpriteSizeLocked,
    }),
    defaultCharacterModeSpriteSize,
  );

type CharacterModeSpriteLibrarySlice = Readonly<{
  handleLibraryPointerDown: CharacterModeState["handleLibraryPointerDown"];
  draggingSpriteIndex: O.Option<number>;
  isLibraryDraggable: boolean;
  sprites: CharacterModeState["sprites"];
}>;

const defaultCharacterModeSpriteLibrary: CharacterModeSpriteLibrarySlice = {
  draggingSpriteIndex: O.none,
  handleLibraryPointerDown: noopPointerButton,
  isLibraryDraggable: false,
  sprites: [],
};

export const useCharacterModeSpriteLibrary =
  (): CharacterModeSpriteLibrarySlice =>
    useCharacterModeSlice(
      (state) => ({
        draggingSpriteIndex: pipe(
          state.libraryDragState,
          O.map((dragState) => dragState.spriteIndex),
        ),
        handleLibraryPointerDown: state.handleLibraryPointerDown,
        isLibraryDraggable:
          state.editorMode === "compose" && O.isSome(state.activeSet),
        sprites: state.sprites,
      }),
      defaultCharacterModeSpriteLibrary,
    );

type CharacterModeStageDisplaySlice = Pick<
  CharacterModeState,
  | "activeSetName"
  | "activeSetSpriteCount"
  | "isStageDropActive"
  | "selectedSpriteStageMetadata"
>;

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
        activeSetName: state.activeSetName,
        activeSetSpriteCount: state.activeSetSpriteCount,
        isStageDropActive: state.isStageDropActive,
        selectedSpriteStageMetadata: state.selectedSpriteStageMetadata,
      }),
      defaultCharacterModeStageDisplay,
    );

type CharacterModeStageSizeSlice = Pick<
  CharacterModeState,
  | "handleStageHeightChange"
  | "handleStageWidthChange"
  | "stageHeight"
  | "stageScale"
  | "stageWidth"
>;

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
      handleStageHeightChange: state.handleStageHeightChange,
      handleStageWidthChange: state.handleStageWidthChange,
      stageHeight: state.stageHeight,
      stageScale: state.stageScale,
      stageWidth: state.stageWidth,
    }),
    defaultCharacterModeStageSize,
  );

type CharacterModeStageZoomSlice = Pick<
  CharacterModeState,
  "handleZoomIn" | "handleZoomOut" | "stageZoomLevel"
>;

const defaultCharacterModeStageZoom: CharacterModeStageZoomSlice = {
  handleZoomIn: noop,
  handleZoomOut: noop,
  stageZoomLevel: CHARACTER_MODE_STAGE_LIMITS.defaultZoomLevel,
};

export const useCharacterModeStageZoom = (): CharacterModeStageZoomSlice =>
  useCharacterModeSlice(
    (state) => ({
      handleZoomIn: state.handleZoomIn,
      handleZoomOut: state.handleZoomOut,
      stageZoomLevel: state.stageZoomLevel,
    }),
    defaultCharacterModeStageZoom,
  );

type CharacterModeStageViewportSlice = Pick<
  CharacterModeState,
  | "handleViewportPointerDown"
  | "handleViewportPointerEnd"
  | "handleViewportPointerMove"
  | "handleViewportRef"
  | "handleViewportWheel"
>;

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
        handleViewportPointerDown: state.handleViewportPointerDown,
        handleViewportPointerEnd: state.handleViewportPointerEnd,
        handleViewportPointerMove: state.handleViewportPointerMove,
        handleViewportRef: state.handleViewportRef,
        handleViewportWheel: state.handleViewportWheel,
      }),
      defaultCharacterModeStageViewport,
    );

type CharacterModeViewportPanSlice = Pick<
  CharacterModeState,
  "viewportPanState"
>;

const defaultCharacterModeViewportPan: CharacterModeViewportPanSlice = {
  viewportPanState: O.none,
};

export const useCharacterModeViewportPan = (): CharacterModeViewportPanSlice =>
  useCharacterModeSlice(
    (state) => ({
      viewportPanState: state.viewportPanState,
    }),
    defaultCharacterModeViewportPan,
  );

type CharacterModeComposeCanvasSlice = Pick<
  CharacterModeState,
  | "getSpriteTile"
  | "handleComposeCanvasRef"
  | "handleComposeContextMenu"
  | "handleStageKeyDown"
  | "handleStageRef"
>;

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
        getSpriteTile: state.getSpriteTile,
        handleComposeCanvasRef: state.handleComposeCanvasRef,
        handleComposeContextMenu: state.handleComposeContextMenu,
        handleStageKeyDown: state.handleStageKeyDown,
        handleStageRef: state.handleStageRef,
      }),
      defaultCharacterModeComposeCanvas,
    );

type CharacterModeLibraryDragPreviewSlice = Pick<
  CharacterModeState,
  "getSpriteTile" | "libraryDragState" | "stageScale"
>;

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
        getSpriteTile: state.getSpriteTile,
        libraryDragState: state.libraryDragState,
        stageScale: state.stageScale,
      }),
      defaultCharacterModeLibraryDragPreview,
    );

type CharacterModeDecompositionToolSlice = Pick<
  CharacterModeState,
  "decompositionTool" | "handleDecompositionToolChange" | "projectSpriteSize"
>;

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
        decompositionTool: state.decompositionTool,
        handleDecompositionToolChange: state.handleDecompositionToolChange,
        projectSpriteSize: state.projectSpriteSize,
      }),
      defaultCharacterModeDecompositionTool,
    );

type CharacterModeDecompositionPaletteSlice = Pick<
  CharacterModeState,
  | "decompositionColorIndex"
  | "decompositionPaletteIndex"
  | "handleDecompositionColorSlotSelect"
  | "handleDecompositionPaletteSelect"
  | "spritePalettes"
>;

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
        decompositionColorIndex: state.decompositionColorIndex,
        decompositionPaletteIndex: state.decompositionPaletteIndex,
        handleDecompositionColorSlotSelect:
          state.handleDecompositionColorSlotSelect,
        handleDecompositionPaletteSelect:
          state.handleDecompositionPaletteSelect,
        spritePalettes: state.spritePalettes,
      }),
      defaultCharacterModeDecompositionPalette,
    );

type CharacterModeDecompositionCanvasSlice = Pick<
  CharacterModeState,
  | "decompositionCanvasCursor"
  | "handleDecompositionCanvasPointerDown"
  | "handleDecompositionCanvasRef"
  | "handleStageRef"
>;

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
        decompositionCanvasCursor: state.decompositionCanvasCursor,
        handleDecompositionCanvasPointerDown:
          state.handleDecompositionCanvasPointerDown,
        handleDecompositionCanvasRef: state.handleDecompositionCanvasRef,
        handleStageRef: state.handleStageRef,
      }),
      defaultCharacterModeDecompositionCanvas,
    );

type CharacterModeDecompositionRegionsSlice = Pick<
  CharacterModeState,
  | "decompositionAnalysis"
  | "decompositionRegions"
  | "handleDecompositionRegionContextMenu"
  | "handleDecompositionRegionPointerDown"
  | "handleSelectRegion"
  | "selectedRegionId"
>;

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
        decompositionAnalysis: state.decompositionAnalysis,
        decompositionRegions: state.decompositionRegions,
        handleDecompositionRegionContextMenu:
          state.handleDecompositionRegionContextMenu,
        handleDecompositionRegionPointerDown:
          state.handleDecompositionRegionPointerDown,
        handleSelectRegion: state.handleSelectRegion,
        selectedRegionId: state.selectedRegionId,
      }),
      defaultCharacterModeDecompositionRegions,
    );

type CharacterModeDecompositionRegionMenuStateSlice = Pick<
  CharacterModeState,
  "closeDecompositionRegionContextMenu" | "decompositionRegionContextMenu"
>;

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
          state.closeDecompositionRegionContextMenu,
        decompositionRegionContextMenu: state.decompositionRegionContextMenu,
      }),
      defaultCharacterModeDecompositionRegionMenuState,
    );

type CharacterModeDecompositionRegionMenuActionsSlice = Pick<
  CharacterModeState,
  "focusStageElement" | "handleDeleteContextMenuRegion"
>;

const defaultCharacterModeDecompositionRegionMenuActions: CharacterModeDecompositionRegionMenuActionsSlice =
  {
    focusStageElement: noop,
    handleDeleteContextMenuRegion: noopString,
  };

export const useCharacterModeDecompositionRegionMenuActions =
  (): CharacterModeDecompositionRegionMenuActionsSlice =>
    useCharacterModeSlice(
      (state) => ({
        focusStageElement: state.focusStageElement,
        handleDeleteContextMenuRegion: state.handleDeleteContextMenuRegion,
      }),
      defaultCharacterModeDecompositionRegionMenuActions,
    );

type CharacterModeDecompositionOverviewSlice = Pick<
  CharacterModeState,
  | "activeSet"
  | "decompositionAnalysis"
  | "decompositionInvalidRegionCount"
  | "decompositionValidRegionCount"
  | "handleApplyDecomposition"
>;

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
    handleApplyDecomposition: noop,
  };

export const useCharacterModeDecompositionOverview =
  (): CharacterModeDecompositionOverviewSlice =>
    useCharacterModeSlice(
      (state) => ({
        activeSet: state.activeSet,
        decompositionAnalysis: state.decompositionAnalysis,
        decompositionInvalidRegionCount: state.decompositionInvalidRegionCount,
        decompositionValidRegionCount: state.decompositionValidRegionCount,
        handleApplyDecomposition: state.handleApplyDecomposition,
      }),
      defaultCharacterModeDecompositionOverview,
    );

type CharacterModeSelectedRegionSlice = Pick<
  CharacterModeState,
  "handleRemoveSelectedRegion" | "selectedRegionAnalysis" | "selectedRegionId"
>;

const defaultCharacterModeSelectedRegion: CharacterModeSelectedRegionSlice = {
  handleRemoveSelectedRegion: noop,
  selectedRegionAnalysis: O.none,
  selectedRegionId: O.none,
};

export const useCharacterModeSelectedRegion =
  (): CharacterModeSelectedRegionSlice =>
    useCharacterModeSlice(
      (state) => ({
        handleRemoveSelectedRegion: state.handleRemoveSelectedRegion,
        selectedRegionAnalysis: state.selectedRegionAnalysis,
        selectedRegionId: state.selectedRegionId,
      }),
      defaultCharacterModeSelectedRegion,
    );
