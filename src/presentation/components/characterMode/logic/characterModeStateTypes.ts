import * as O from "fp-ts/Option";
import type {
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  WheelEventHandler,
} from "react";
import type {
  PaletteIndex,
  ProjectSpriteSize,
  ProjectState,
  SpriteTile,
} from "../../../../application/state/projectStore";
import type {
  CharacterDecompositionAnalysis,
  CharacterDecompositionRegion,
  CharacterDecompositionRegionAnalysis,
} from "../../../../domain/characters/characterDecomposition";
import type { CharacterSet } from "../../../../domain/characters/characterSet";
import type { FileShareAction } from "../../common/logic/state/fileMenuState";
import type { DecompositionTool } from "../ui/primitives/CharacterModePrimitives";
import type {
  DecompositionRegionContextMenuState,
  LibraryDragState,
  SpriteContextMenuState,
  ViewportPanState,
} from "./types/characterModeInteractionState";
import type { CharacterEditorMode } from "./view/characterEditorMode";

export interface CharacterModeProjectSection {
  activeSet: O.Option<CharacterSet>;
  activeSetId: string;
  activeSetName: string;
  activeSetSpriteCount: number;
  characterSets: ReadonlyArray<CharacterSet>;
  selectedCharacterId: O.Option<string>;
  projectActions: ReadonlyArray<FileShareAction>;
  editorMode: {
    value: CharacterEditorMode;
    handleChange: (mode: CharacterEditorMode) => void;
  };
  setDraft: {
    newName: string;
    handleCreateSet: () => void;
    handleNewNameChange: (value: string) => void;
  };
  setNaming: {
    handleSetNameChange: (name: string) => void;
  };
  setSelection: {
    handleDeleteSet: (setId: string) => void;
    handleSelectSet: (value: string) => void;
  };
  spriteSize: {
    projectSpriteSize: ProjectSpriteSize;
    projectSpriteSizeLocked: boolean;
    handleProjectSpriteSizeChange: (nextSpriteSize: ProjectSpriteSize) => void;
  };
}

export interface CharacterModeSelectedSpriteStageMetadata {
  index: string;
  x: string;
  y: string;
  layer: string;
}

export interface CharacterModeStageSection {
  activeSetName: string;
  activeSetSpriteCount: number;
  isStageDropActive: boolean;
  selectedSpriteStageMetadata: CharacterModeSelectedSpriteStageMetadata;
  stageHeight: number;
  stageScale: number;
  stageWidth: number;
  stageZoomLevel: number;
  viewportPanState: O.Option<ViewportPanState>;
  focusStageElement: () => void;
  handleStageHeightChange: (rawValue: string) => void;
  handleStageRef: (element: HTMLDivElement | null) => void;
  handleStageWidthChange: (rawValue: string) => void;
  handleViewportPointerDown: PointerEventHandler<HTMLDivElement>;
  handleViewportPointerEnd: PointerEventHandler<HTMLDivElement>;
  handleViewportPointerMove: PointerEventHandler<HTMLDivElement>;
  handleViewportRef: (element: HTMLDivElement | null) => void;
  handleViewportWheel: WheelEventHandler<HTMLDivElement>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export interface CharacterModeLibrarySection {
  getSpriteTile: (spriteIndex: number) => O.Option<SpriteTile>;
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  isLibraryDraggable: boolean;
  isSpriteDragging: (spriteIndex: number) => boolean;
  libraryDragState: O.Option<LibraryDragState>;
  sprites: ProjectState["sprites"];
}

export interface CharacterModeComposeSection {
  handleComposeCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleComposeContextMenu: MouseEventHandler<HTMLElement>;
  handleStageKeyDown: KeyboardEventHandler<HTMLDivElement>;
  spriteMenu: {
    closeSpriteContextMenu: () => void;
    handleDeleteContextMenuSprite: (spriteEditorIndex: number) => void;
    handleShiftContextMenuSpriteLayer: (
      spriteEditorIndex: number,
      amount: number,
    ) => void;
    spriteContextMenu: O.Option<SpriteContextMenuState>;
  };
}

export interface CharacterModeDecompositionSection {
  canvas: {
    decompositionCanvasCursor: string;
    handleDecompositionCanvasPointerDown: PointerEventHandler<HTMLCanvasElement>;
    handleDecompositionCanvasRef: (element: HTMLCanvasElement | null) => void;
  };
  palette: {
    decompositionColorIndex: 1 | 2 | 3;
    decompositionPaletteIndex: PaletteIndex;
    handleDecompositionColorSlotSelect: (slotIndex: 1 | 2 | 3) => void;
    handleDecompositionPaletteSelect: (value: string | number) => void;
    spritePalettes: ProjectState["nes"]["spritePalettes"];
  };
  regionMenu: {
    closeDecompositionRegionContextMenu: () => void;
    decompositionRegionContextMenu: O.Option<DecompositionRegionContextMenuState>;
    handleDeleteContextMenuRegion: (regionId: string) => void;
  };
  regions: {
    decompositionAnalysis: CharacterDecompositionAnalysis;
    decompositionInvalidRegionCount: number;
    decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>;
    decompositionValidRegionCount: number;
    handleApplyDecomposition: () => boolean;
    handleDecompositionRegionContextMenu: (
      event: React.MouseEvent<HTMLButtonElement>,
      region: CharacterDecompositionRegion,
    ) => void;
    handleDecompositionRegionPointerDown: (
      event: React.PointerEvent<HTMLButtonElement>,
      region: CharacterDecompositionRegion,
    ) => void;
    handleRemoveSelectedRegion: () => void;
    handleSelectRegion: (regionId: string) => void;
    selectedRegionAnalysis: O.Option<CharacterDecompositionRegionAnalysis>;
    selectedRegionId: O.Option<string>;
  };
  tool: {
    decompositionTool: DecompositionTool;
    handleDecompositionToolChange: (tool: DecompositionTool) => void;
    projectSpriteSize: ProjectSpriteSize;
  };
}

export interface CharacterModeWorkspaceSection {
  handleWorkspacePointerDownCapture: PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerEnd: PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerMove: PointerEventHandler<HTMLDivElement>;
}

export interface CharacterModeState {
  project: CharacterModeProjectSection;
  stage: CharacterModeStageSection;
  library: CharacterModeLibrarySection;
  compose: CharacterModeComposeSection;
  decomposition: CharacterModeDecompositionSection;
  workspace: CharacterModeWorkspaceSection;
}
