import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useCallback, useMemo } from "react";
import { useCharacterState } from "../../../../../../application/state/characterStore";
import {
  useProjectState,
  type ProjectState,
} from "../../../../../../application/state/projectStore";
import type {
  CharacterDecompositionAnalysis,
  CharacterDecompositionRegion,
  CharacterDecompositionRegionAnalysis,
} from "../../../../../../domain/characters/characterDecomposition";
import {
  buildCharacterPreviewHexGrid,
  type CharacterSet,
} from "../../../../../../domain/characters/characterSet";
import useExportImage from "../../../../../../infrastructure/browser/useExportImage";
import { type FileShareAction } from "../../../../common/logic/state/fileMenuState";
import {
  selectActiveSet,
  selectActiveSetName,
  selectActiveSetSpriteCount,
  selectDecompositionAnalysis,
  selectDecompositionCanvasCursor,
  selectDecompositionInvalidRegionCount,
  selectDecompositionRegionContextMenu,
  selectDecompositionValidRegionCount,
  selectIsLibraryDraggable,
  selectIsStageDropActive,
  selectProjectSpriteSizeLocked,
  selectSelectedRegionAnalysis,
  selectSelectedSpriteStageMetadata,
  selectStageScale,
} from "../../../logic/characterModeSelectors";
import { useCharacterModeStore } from "../../../logic/characterModeStore";
import {
  ensureSelectedCharacterSpriteIndex,
  resolveVisibleSpriteContextMenu,
} from "../../../logic/model/characterEditorModel";
import { useCharacterModeComposeBridge } from "../../../logic/useCharacterModeComposeBridge";
import { useCharacterModeDecompositionBridge } from "../../../logic/useCharacterModeDecompositionBridge";
import { useCharacterModeStageBridge } from "../../../logic/useCharacterModeStageBridge";

// ---------------------------------------------------------------------------
// Project actions helper (moved from useCharacterModeProjectState)
// ---------------------------------------------------------------------------

const PREVIEW_TRANSPARENT_HEX = "#00000000";

interface CharacterPreviewReadyState {
  kind: "ready";
  grid: string[][];
}

type CharacterPreviewState = CharacterPreviewReadyState | { kind: "error" };

const createCharacterModeProjectActions = (params: {
  activeSet: O.Option<CharacterSet>;
  exportCharacterJson: ReturnType<typeof useExportImage>["exportCharacterJson"];
  exportPng: ReturnType<typeof useExportImage>["exportPng"];
  exportSvgSimple: ReturnType<typeof useExportImage>["exportSvgSimple"];
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  sprites: ProjectState["sprites"];
}): ReadonlyArray<FileShareAction> =>
  pipe(
    params.activeSet,
    O.match(
      (): ReadonlyArray<FileShareAction> => [],
      (characterSet) => {
        const resolvePreviewState = (): CharacterPreviewState => {
          const preview = buildCharacterPreviewHexGrid(characterSet, {
            sprites: params.sprites,
            palettes: params.spritePalettes,
            transparentHex: PREVIEW_TRANSPARENT_HEX,
          });

          if (E.isLeft(preview)) {
            return { kind: "error" };
          }

          return {
            kind: "ready",
            grid: preview.right,
          };
        };

        return [
          {
            id: "share-export-png",
            label: "PNGエクスポート",
            onSelect: () => {
              const previewState = resolvePreviewState();
              if (previewState.kind !== "ready") {
                return;
              }

              void params.exportPng(
                previewState.grid,
                `${characterSet.name}.png`,
              );
            },
          },
          {
            id: "share-export-svg",
            label: "SVGエクスポート",
            onSelect: () => {
              const previewState = resolvePreviewState();
              if (previewState.kind !== "ready") {
                return;
              }

              void params.exportSvgSimple(
                previewState.grid,
                8,
                `${characterSet.name}.svg`,
              );
            },
          },
          {
            id: "share-export-character-json",
            label: "キャラクターJSON書き出し",
            onSelect: () =>
              void params.exportCharacterJson(
                {
                  characterSets: [characterSet],
                  selectedCharacterId: characterSet.id,
                },
                `${characterSet.name}.json`,
              ),
          },
        ] satisfies ReadonlyArray<FileShareAction>;
      },
    ),
  );

// ---------------------------------------------------------------------------
// Bridge context — holds only DOM-dependent callback references
// ---------------------------------------------------------------------------

interface CharacterModeBridgeContextValue {
  readonly focusStageElement: () => void;
  readonly handleComposeCanvasRef: (element: HTMLCanvasElement | null) => void;
  readonly handleComposeContextMenu: React.MouseEventHandler<HTMLElement>;
  readonly handleDecompositionCanvasPointerDown: React.PointerEventHandler<HTMLCanvasElement>;
  readonly handleDecompositionCanvasRef: (
    element: HTMLCanvasElement | null,
  ) => void;
  readonly handleDecompositionRegionContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  readonly handleDecompositionRegionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  readonly handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  readonly handleStageKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  readonly handleStageRef: (element: HTMLDivElement | null) => void;
  readonly handleViewportPointerDown: React.PointerEventHandler<HTMLDivElement>;
  readonly handleViewportPointerEnd: React.PointerEventHandler<HTMLDivElement>;
  readonly handleViewportPointerMove: React.PointerEventHandler<HTMLDivElement>;
  readonly handleViewportRef: (element: HTMLDivElement | null) => void;
  readonly handleViewportWheel: React.WheelEventHandler<HTMLDivElement>;
  readonly handleWorkspacePointerDownCapture: React.PointerEventHandler<HTMLDivElement>;
  readonly handleWorkspacePointerEnd: React.PointerEventHandler<HTMLDivElement>;
  readonly handleWorkspacePointerMove: React.PointerEventHandler<HTMLDivElement>;
}

const noop = (): void => {};
const noopPointer: React.PointerEventHandler<HTMLDivElement> = () => {};

const defaultBridgeContext: CharacterModeBridgeContextValue = {
  focusStageElement: noop,
  handleComposeCanvasRef: () => {},
  handleComposeContextMenu: () => {},
  handleDecompositionCanvasPointerDown: () => {},
  handleDecompositionCanvasRef: () => {},
  handleDecompositionRegionContextMenu: () => {},
  handleDecompositionRegionPointerDown: () => {},
  handleLibraryPointerDown: () => {},
  handleStageKeyDown: () => {},
  handleStageRef: () => {},
  handleViewportPointerDown: noopPointer,
  handleViewportPointerEnd: noopPointer,
  handleViewportPointerMove: noopPointer,
  handleViewportRef: () => {},
  handleViewportWheel: () => {},
  handleWorkspacePointerDownCapture: noopPointer,
  handleWorkspacePointerEnd: noopPointer,
  handleWorkspacePointerMove: noopPointer,
};

const CharacterModeBridgeContext =
  React.createContext<CharacterModeBridgeContextValue>(defaultBridgeContext);

const useCharacterModeBridge = (): CharacterModeBridgeContextValue =>
  React.useContext(CharacterModeBridgeContext);

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

interface CharacterModeStateProviderProps {
  children: React.ReactNode;
}

export const CharacterModeStateProvider: React.FC<
  CharacterModeStateProviderProps
> = ({ children }) => {
  const stageBridge = useCharacterModeStageBridge();
  const composeBridge = useCharacterModeComposeBridge(
    stageBridge.focusStageElement,
    stageBridge.getStageRect,
  );
  const decompositionBridge = useCharacterModeDecompositionBridge(
    stageBridge.getStageRect,
  );

  const {
    handleComposeWorkspacePointerEnd,
    handleComposeWorkspacePointerMove,
  } = composeBridge;

  const {
    handleDecompositionWorkspacePointerEnd,
    handleDecompositionWorkspacePointerMove,
  } = decompositionBridge;

  const handleWorkspacePointerDownCapture = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >((event) => {
    const targetElement = event.target;
    const isInsideContextMenu =
      targetElement instanceof Element &&
      targetElement.closest("[data-context-menu]") instanceof Element;
    useCharacterModeStore
      .getState()
      .handleWorkspacePointerDownCapture(isInsideContextMenu);
  }, []);

  const handleWorkspacePointerMove = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (handleComposeWorkspacePointerMove(event) === true) {
        return;
      }
      handleDecompositionWorkspacePointerMove(event);
    },
    [
      handleComposeWorkspacePointerMove,
      handleDecompositionWorkspacePointerMove,
    ],
  );

  const handleWorkspacePointerEnd = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (handleComposeWorkspacePointerEnd(event) === true) {
        return;
      }
      handleDecompositionWorkspacePointerEnd(event);
    },
    [handleComposeWorkspacePointerEnd, handleDecompositionWorkspacePointerEnd],
  );

  const bridgeValue = useMemo(
    (): CharacterModeBridgeContextValue => ({
      focusStageElement: stageBridge.focusStageElement,
      handleComposeCanvasRef: composeBridge.handleComposeCanvasRef,
      handleComposeContextMenu: composeBridge.handleComposeContextMenu,
      handleDecompositionCanvasPointerDown:
        decompositionBridge.handleDecompositionCanvasPointerDown,
      handleDecompositionCanvasRef:
        decompositionBridge.handleDecompositionCanvasRef,
      handleDecompositionRegionContextMenu:
        decompositionBridge.handleDecompositionRegionContextMenu,
      handleDecompositionRegionPointerDown:
        decompositionBridge.handleDecompositionRegionPointerDown,
      handleLibraryPointerDown: composeBridge.handleLibraryPointerDown,
      handleStageKeyDown: composeBridge.handleStageKeyDown,
      handleStageRef: stageBridge.handleStageRef,
      handleViewportPointerDown: stageBridge.handleViewportPointerDown,
      handleViewportPointerEnd: stageBridge.handleViewportPointerEnd,
      handleViewportPointerMove: stageBridge.handleViewportPointerMove,
      handleViewportRef: stageBridge.handleViewportRef,
      handleViewportWheel: stageBridge.handleViewportWheel,
      handleWorkspacePointerDownCapture,
      handleWorkspacePointerEnd,
      handleWorkspacePointerMove,
    }),
    [
      composeBridge.handleComposeCanvasRef,
      composeBridge.handleComposeContextMenu,
      composeBridge.handleLibraryPointerDown,
      composeBridge.handleStageKeyDown,
      decompositionBridge.handleDecompositionCanvasPointerDown,
      decompositionBridge.handleDecompositionCanvasRef,
      decompositionBridge.handleDecompositionRegionContextMenu,
      decompositionBridge.handleDecompositionRegionPointerDown,
      handleWorkspacePointerDownCapture,
      handleWorkspacePointerEnd,
      handleWorkspacePointerMove,
      stageBridge.focusStageElement,
      stageBridge.handleStageRef,
      stageBridge.handleViewportPointerDown,
      stageBridge.handleViewportPointerEnd,
      stageBridge.handleViewportPointerMove,
      stageBridge.handleViewportRef,
      stageBridge.handleViewportWheel,
    ],
  );

  return (
    <CharacterModeBridgeContext.Provider value={bridgeValue}>
      {children}
    </CharacterModeBridgeContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Internal shared hooks
// ---------------------------------------------------------------------------

const useActiveSet = (): O.Option<CharacterSet> => {
  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  return useMemo(
    () => selectActiveSet(characterSets, selectedCharacterId),
    [characterSets, selectedCharacterId],
  );
};

const useDecompositionAnalysisDerived = (): CharacterDecompositionAnalysis => {
  const editorMode = useCharacterModeStore((s) => s.editorMode);
  const decompositionCanvas = useCharacterModeStore(
    (s) => s.decompositionCanvas,
  );
  const decompositionRegions = useCharacterModeStore(
    (s) => s.decompositionRegions,
  );
  const sprites = useProjectState((s) => s.sprites);
  const projectSpriteSize = useProjectState((s) => s.spriteSize);
  return useMemo(
    () =>
      selectDecompositionAnalysis(
        editorMode,
        decompositionCanvas,
        decompositionRegions,
        projectSpriteSize,
        sprites,
      ),
    [
      decompositionCanvas,
      decompositionRegions,
      editorMode,
      projectSpriteSize,
      sprites,
    ],
  );
};

// ---------------------------------------------------------------------------
// Public hooks — same export names for consumer compatibility
// ---------------------------------------------------------------------------

export const useCharacterModeProjectActions = (): Readonly<{
  projectActions: ReadonlyArray<FileShareAction>;
}> => {
  const activeSet = useActiveSet();
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const { exportPng, exportSvgSimple, exportCharacterJson } = useExportImage();
  const projectActions = useMemo(
    () =>
      createCharacterModeProjectActions({
        activeSet,
        exportCharacterJson,
        exportPng,
        exportSvgSimple,
        spritePalettes,
        sprites,
      }),
    [
      activeSet,
      exportCharacterJson,
      exportPng,
      exportSvgSimple,
      spritePalettes,
      sprites,
    ],
  );
  return { projectActions };
};

export const useCharacterModeWorkspaceEvents = (): Readonly<{
  handleWorkspacePointerDownCapture: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleWorkspacePointerMove: React.PointerEventHandler<HTMLDivElement>;
}> => {
  const bridge = useCharacterModeBridge();
  return {
    handleWorkspacePointerDownCapture: bridge.handleWorkspacePointerDownCapture,
    handleWorkspacePointerEnd: bridge.handleWorkspacePointerEnd,
    handleWorkspacePointerMove: bridge.handleWorkspacePointerMove,
  };
};

export const useCharacterModeEditorModeValue = (): Readonly<{
  editorMode: "compose" | "decompose";
}> => {
  const editorMode = useCharacterModeStore((s) => s.editorMode);
  return { editorMode };
};

export const useCharacterModeSpriteMenuState = (): Readonly<{
  closeSpriteContextMenu: () => void;
  handleComposeContextMenu: React.MouseEventHandler<HTMLElement>;
  spriteContextMenu: O.Option<{
    clientX: number;
    clientY: number;
    spriteEditorIndex: number;
  }>;
}> => {
  const bridge = useCharacterModeBridge();
  const editorMode = useCharacterModeStore((s) => s.editorMode);
  const spriteContextMenuState = useCharacterModeStore(
    (s) => s.spriteContextMenuState,
  );
  const selectedSpriteEditorIndex = useCharacterModeStore(
    (s) => s.selectedSpriteEditorIndex,
  );
  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);

  const spriteContextMenu = useMemo(() => {
    const activeSet = selectActiveSet(characterSets, selectedCharacterId);
    const hasSelectedSprite = pipe(
      activeSet,
      O.chain((cs) =>
        pipe(
          ensureSelectedCharacterSpriteIndex(
            selectedSpriteEditorIndex,
            cs.sprites.length,
          ),
          O.chain((index) => O.fromNullable(cs.sprites[index])),
        ),
      ),
      O.isSome,
    );
    return resolveVisibleSpriteContextMenu(
      editorMode === "compose",
      hasSelectedSprite,
      spriteContextMenuState,
    );
  }, [
    characterSets,
    editorMode,
    selectedCharacterId,
    selectedSpriteEditorIndex,
    spriteContextMenuState,
  ]);

  return {
    closeSpriteContextMenu:
      useCharacterModeStore.getState().closeSpriteContextMenu,
    handleComposeContextMenu: bridge.handleComposeContextMenu,
    spriteContextMenu,
  };
};

export const useCharacterModeSpriteMenuActions = (): Readonly<{
  focusStageElement: () => void;
  handleDeleteContextMenuSprite: (spriteEditorIndex: number) => void;
  handleShiftContextMenuSpriteLayer: (
    spriteEditorIndex: number,
    amount: number,
  ) => void;
}> => {
  const bridge = useCharacterModeBridge();
  const store = useCharacterModeStore.getState();
  return {
    focusStageElement: bridge.focusStageElement,
    handleDeleteContextMenuSprite: store.handleDeleteContextMenuSprite,
    handleShiftContextMenuSpriteLayer: store.handleShiftContextMenuSpriteLayer,
  };
};

export const useCharacterModeSetDraft = (): Readonly<{
  handleCreateSet: () => void;
  handleNewNameChange: (value: string) => void;
  newName: string;
}> => {
  const newName = useCharacterModeStore((s) => s.newName);
  return {
    handleCreateSet: useCharacterModeStore.getState().handleCreateSet,
    handleNewNameChange: useCharacterModeStore.getState().setNewName,
    newName,
  };
};

export const useCharacterModeSetSelection = (): Readonly<{
  characterSets: ReadonlyArray<CharacterSet>;
  handleDeleteSet: (setId: string) => void;
  handleSelectSet: (value: string) => void;
  selectedCharacterId: O.Option<string>;
}> => {
  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  return {
    characterSets,
    handleDeleteSet: useCharacterModeStore.getState().handleDeleteSet,
    handleSelectSet: useCharacterModeStore.getState().handleSelectSet,
    selectedCharacterId,
  };
};

export const useCharacterModeSetName = (): Readonly<{
  activeSet: O.Option<CharacterSet>;
  activeSetName: string;
  handleSetNameChange: (name: string) => void;
}> => {
  const activeSet = useActiveSet();
  const activeSetName = useMemo(
    () => selectActiveSetName(activeSet),
    [activeSet],
  );
  return {
    activeSet,
    activeSetName,
    handleSetNameChange: useCharacterModeStore.getState().handleSetNameChange,
  };
};

export const useCharacterModeEditorModeSetting = (): Readonly<{
  editorMode: "compose" | "decompose";
  handleEditorModeChange: (mode: "compose" | "decompose") => void;
}> => {
  const editorMode = useCharacterModeStore((s) => s.editorMode);
  return {
    editorMode,
    handleEditorModeChange:
      useCharacterModeStore.getState().handleEditorModeChange,
  };
};

export const useCharacterModeSpriteSize = (): Readonly<{
  handleProjectSpriteSizeChange: (nextSpriteSize: 8 | 16) => void;
  projectSpriteSize: 8 | 16;
  projectSpriteSizeLocked: boolean;
}> => {
  const projectSpriteSize = useProjectState((s) => s.spriteSize);
  const sprites = useProjectState((s) => s.sprites);
  const screenSpriteCount = useProjectState((s) => s.screen.sprites.length);
  const characterSets = useCharacterState((s) => s.characterSets);
  const projectSpriteSizeLocked = useMemo(
    () =>
      selectProjectSpriteSizeLocked(sprites, screenSpriteCount, characterSets),
    [characterSets, screenSpriteCount, sprites],
  );
  return {
    handleProjectSpriteSizeChange:
      useCharacterModeStore.getState().handleProjectSpriteSizeChange,
    projectSpriteSize,
    projectSpriteSizeLocked,
  };
};

export const useCharacterModeSpriteLibrary = (): Readonly<{
  draggingSpriteIndex: number;
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  isLibraryDraggable: boolean;
  sprites: ProjectState["sprites"];
}> => {
  const bridge = useCharacterModeBridge();
  const sprites = useProjectState((s) => s.sprites);
  const libraryDragState = useCharacterModeStore((s) => s.libraryDragState);
  const editorMode = useCharacterModeStore((s) => s.editorMode);
  const activeSet = useActiveSet();
  const draggingSpriteIndex = pipe(
    libraryDragState,
    O.match(
      () => -1,
      (drag) => drag.spriteIndex,
    ),
  );
  return {
    draggingSpriteIndex,
    handleLibraryPointerDown: bridge.handleLibraryPointerDown,
    isLibraryDraggable: selectIsLibraryDraggable(editorMode, activeSet),
    sprites,
  };
};

export const useCharacterModeStageDisplay = (): Readonly<{
  activeSetName: string;
  activeSetSpriteCount: number;
  isStageDropActive: boolean;
  selectedSpriteStageMetadata: {
    index: string;
    layer: string;
    x: string;
    y: string;
  };
}> => {
  const activeSet = useActiveSet();
  const libraryDragState = useCharacterModeStore((s) => s.libraryDragState);
  const selectedSpriteEditorIndex = useCharacterModeStore(
    (s) => s.selectedSpriteEditorIndex,
  );
  return {
    activeSetName: selectActiveSetName(activeSet),
    activeSetSpriteCount: selectActiveSetSpriteCount(activeSet),
    isStageDropActive: selectIsStageDropActive(libraryDragState),
    selectedSpriteStageMetadata: selectSelectedSpriteStageMetadata(
      activeSet,
      selectedSpriteEditorIndex,
    ),
  };
};

export const useCharacterModeStageSize = (): Readonly<{
  handleStageHeightChange: (rawValue: string) => void;
  handleStageWidthChange: (rawValue: string) => void;
  stageHeight: number;
  stageScale: number;
  stageWidth: number;
}> => {
  const stageWidth = useCharacterModeStore((s) => s.stageWidth);
  const stageHeight = useCharacterModeStore((s) => s.stageHeight);
  const stageZoomLevel = useCharacterModeStore((s) => s.stageZoomLevel);
  const stageScale = useMemo(
    () => selectStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );
  return {
    handleStageHeightChange:
      useCharacterModeStore.getState().handleStageHeightChange,
    handleStageWidthChange:
      useCharacterModeStore.getState().handleStageWidthChange,
    stageHeight,
    stageScale,
    stageWidth,
  };
};

export const useCharacterModeStageZoom = (): Readonly<{
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  stageZoomLevel: number;
}> => {
  const stageZoomLevel = useCharacterModeStore((s) => s.stageZoomLevel);
  return {
    handleZoomIn: useCharacterModeStore.getState().handleZoomIn,
    handleZoomOut: useCharacterModeStore.getState().handleZoomOut,
    stageZoomLevel,
  };
};

export const useCharacterModeStageViewport = (): Readonly<{
  handleViewportPointerDown: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerMove: React.PointerEventHandler<HTMLDivElement>;
  handleViewportRef: (element: HTMLDivElement | null) => void;
  handleViewportWheel: React.WheelEventHandler<HTMLDivElement>;
}> => {
  const bridge = useCharacterModeBridge();
  return {
    handleViewportPointerDown: bridge.handleViewportPointerDown,
    handleViewportPointerEnd: bridge.handleViewportPointerEnd,
    handleViewportPointerMove: bridge.handleViewportPointerMove,
    handleViewportRef: bridge.handleViewportRef,
    handleViewportWheel: bridge.handleViewportWheel,
  };
};

export const useCharacterModeViewportPan = (): Readonly<{
  viewportPanState: O.Option<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>;
}> => {
  const viewportPanState = useCharacterModeStore((s) => s.viewportPanState);
  return { viewportPanState };
};

export const useCharacterModeComposeCanvas = (): Readonly<{
  getSpriteTile: (
    spriteIndex: number,
  ) => O.Option<ProjectState["sprites"][number]>;
  handleComposeCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleComposeContextMenu: React.MouseEventHandler<HTMLElement>;
  handleStageKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  handleStageRef: (element: HTMLDivElement | null) => void;
}> => {
  const bridge = useCharacterModeBridge();
  const sprites = useProjectState((s) => s.sprites);
  const getSpriteTile = useCallback(
    (spriteIndex: number) => O.fromNullable(sprites[spriteIndex]),
    [sprites],
  );
  return {
    getSpriteTile,
    handleComposeCanvasRef: bridge.handleComposeCanvasRef,
    handleComposeContextMenu: bridge.handleComposeContextMenu,
    handleStageKeyDown: bridge.handleStageKeyDown,
    handleStageRef: bridge.handleStageRef,
  };
};

export const useCharacterModeLibraryDragPreview = (): Readonly<{
  getSpriteTile: (
    spriteIndex: number,
  ) => O.Option<ProjectState["sprites"][number]>;
  libraryDragState: O.Option<{
    spriteIndex: number;
    clientX: number;
    clientY: number;
    isOverStage: boolean;
    stageX: number;
    stageY: number;
  }>;
  stageScale: number;
}> => {
  const sprites = useProjectState((s) => s.sprites);
  const libraryDragState = useCharacterModeStore((s) => s.libraryDragState);
  const stageWidth = useCharacterModeStore((s) => s.stageWidth);
  const stageHeight = useCharacterModeStore((s) => s.stageHeight);
  const stageZoomLevel = useCharacterModeStore((s) => s.stageZoomLevel);
  const getSpriteTile = useCallback(
    (spriteIndex: number) => O.fromNullable(sprites[spriteIndex]),
    [sprites],
  );
  const stageScale = useMemo(
    () => selectStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );
  return { getSpriteTile, libraryDragState, stageScale };
};

export const useCharacterModeDecompositionTool = (): Readonly<{
  decompositionTool: "pen" | "eraser" | "region";
  handleDecompositionToolChange: (tool: "pen" | "eraser" | "region") => void;
  projectSpriteSize: 8 | 16;
}> => {
  const decompositionTool = useCharacterModeStore((s) => s.decompositionTool);
  const projectSpriteSize = useProjectState((s) => s.spriteSize);
  return {
    decompositionTool,
    handleDecompositionToolChange:
      useCharacterModeStore.getState().setDecompositionTool,
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
  const decompositionColorIndex = useCharacterModeStore(
    (s) => s.decompositionColorIndex,
  );
  const decompositionPaletteIndex = useCharacterModeStore(
    (s) => s.decompositionPaletteIndex,
  );
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  return {
    decompositionColorIndex,
    decompositionPaletteIndex,
    handleDecompositionColorSlotSelect:
      useCharacterModeStore.getState().handleDecompositionColorSlotSelect,
    handleDecompositionPaletteSelect:
      useCharacterModeStore.getState().handleDecompositionPaletteSelect,
    spritePalettes,
  };
};

export const useCharacterModeDecompositionCanvas = (): Readonly<{
  decompositionCanvasCursor: string;
  handleDecompositionCanvasPointerDown: React.PointerEventHandler<HTMLCanvasElement>;
  handleDecompositionCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleStageRef: (element: HTMLDivElement | null) => void;
}> => {
  const bridge = useCharacterModeBridge();
  const decompositionTool = useCharacterModeStore((s) => s.decompositionTool);
  return {
    decompositionCanvasCursor:
      selectDecompositionCanvasCursor(decompositionTool),
    handleDecompositionCanvasPointerDown:
      bridge.handleDecompositionCanvasPointerDown,
    handleDecompositionCanvasRef: bridge.handleDecompositionCanvasRef,
    handleStageRef: bridge.handleStageRef,
  };
};

export const useCharacterModeDecompositionRegions = (): Readonly<{
  decompositionAnalysis: CharacterDecompositionAnalysis;
  decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>;
  handleDecompositionRegionContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  handleDecompositionRegionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  handleSelectRegion: (regionId: string) => void;
  selectedRegionId: O.Option<string>;
}> => {
  const bridge = useCharacterModeBridge();
  const decompositionRegions = useCharacterModeStore(
    (s) => s.decompositionRegions,
  );
  const selectedRegionId = useCharacterModeStore((s) => s.selectedRegionId);
  const decompositionAnalysis = useDecompositionAnalysisDerived();
  return {
    decompositionAnalysis,
    decompositionRegions,
    handleDecompositionRegionContextMenu:
      bridge.handleDecompositionRegionContextMenu,
    handleDecompositionRegionPointerDown:
      bridge.handleDecompositionRegionPointerDown,
    handleSelectRegion: useCharacterModeStore.getState().handleSelectRegion,
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
  const editorMode = useCharacterModeStore((s) => s.editorMode);
  const menuState = useCharacterModeStore(
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
      useCharacterModeStore.getState().closeDecompositionRegionContextMenu,
    decompositionRegionContextMenu,
  };
};

export const useCharacterModeDecompositionRegionMenuActions = (): Readonly<{
  focusStageElement: () => void;
  handleDeleteContextMenuRegion: (regionId: string) => void;
}> => {
  const bridge = useCharacterModeBridge();
  return {
    focusStageElement: bridge.focusStageElement,
    handleDeleteContextMenuRegion:
      useCharacterModeStore.getState().handleDeleteContextMenuRegion,
  };
};

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
      useCharacterModeStore.getState().handleApplyDecomposition,
  };
};

export const useCharacterModeSelectedRegion = (): Readonly<{
  handleRemoveSelectedRegion: () => void;
  selectedRegionAnalysis: O.Option<CharacterDecompositionRegionAnalysis>;
  selectedRegionId: O.Option<string>;
}> => {
  const selectedRegionId = useCharacterModeStore((s) => s.selectedRegionId);
  const decompositionAnalysis = useDecompositionAnalysisDerived();
  const selectedRegionAnalysis = useMemo(
    () => selectSelectedRegionAnalysis(selectedRegionId, decompositionAnalysis),
    [decompositionAnalysis, selectedRegionId],
  );
  return {
    handleRemoveSelectedRegion:
      useCharacterModeStore.getState().handleRemoveSelectedRegion,
    selectedRegionAnalysis,
    selectedRegionId,
  };
};
