import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  type ProjectSpriteSize,
  useProjectState,
} from "../../../../application/state/projectStore";
import { createEmptySpriteTile } from "../../../../domain/project/project";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import { clamp, toNumber } from "./geometry/characterModeBounds";
import { type CharacterEditorMode } from "./view/characterEditorMode";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import { type CharacterModeState } from "./characterModeStateTypes";
import { useCharacterModeComposeState } from "./useCharacterModeComposeState";
import { useCharacterModeDecompositionState } from "./useCharacterModeDecompositionState";
import { useCharacterModeProjectState } from "./useCharacterModeProjectState";
import { useCharacterModeStageState } from "./useCharacterModeStageState";
import { useCharacterModeWorkspaceState } from "./useCharacterModeWorkspaceState";

/**
 * キャラクター編集画面の公開 state を組み立てます。
 * 実装は責務別フックへ分割し、provider には画面向けの明示的なモデルだけを公開します。
 */
export const useCharacterModeInternalState = (): CharacterModeState => {
  const projectState = useCharacterModeProjectState();
  const stageState = useCharacterModeStageState();
  const composeState = useCharacterModeComposeState({
    activeSet: projectState.activeSet,
    addSprite: projectState.addSprite,
    editorMode: projectState.editorMode,
    focusStageElement: stageState.focusStageElement,
    getStageRect: stageState.getStageRect,
    removeSprite: projectState.removeSprite,
    setSprite: projectState.setSprite,
    spritePalettes: projectState.spritePalettes,
    sprites: projectState.sprites,
    stageHeight: stageState.stageHeight,
    stageScale: stageState.stageScale,
    stageWidth: stageState.stageWidth,
  });
  const decompositionState = useCharacterModeDecompositionState({
    activeSet: projectState.activeSet,
    editorMode: projectState.editorMode,
    getStageRect: stageState.getStageRect,
    projectSpriteSize: projectState.projectSpriteSize,
    screen: projectState.screen,
    spritePalettes: projectState.spritePalettes,
    sprites: projectState.sprites,
    stageHeight: stageState.stageHeight,
    stageScale: stageState.stageScale,
    stageWidth: stageState.stageWidth,
  });
  const workspaceState = useCharacterModeWorkspaceState({
    closeDecompositionRegionContextMenu:
      decompositionState.closeDecompositionRegionContextMenu,
    closeSpriteContextMenu: composeState.closeSpriteContextMenu,
    handleComposeWorkspacePointerEnd: composeState.handleWorkspacePointerEnd,
    handleComposeWorkspacePointerMove: composeState.handleWorkspacePointerMove,
    handleDecompositionWorkspacePointerEnd:
      decompositionState.handleWorkspacePointerEnd,
    handleDecompositionWorkspacePointerMove:
      decompositionState.handleWorkspacePointerMove,
  });

  const handleCreateSet = () => {
    projectState.createSet({ name: projectState.newName });
    composeState.clearSelectionAndDrag();
    decompositionState.clearSelectedRegion();
  };

  const handleSelectSet = (value: string) => {
    projectState.selectSet(value === "" ? O.none : O.some(value));
    composeState.clearSelectionAndDrag();
    decompositionState.clearSelectedRegion();
  };

  const handleDeleteSet = (setId: string) => {
    projectState.deleteSet(setId);
    composeState.clearSelectionAndDrag();
    decompositionState.clearSelectedRegion();
  };

  const handleSetNameChange = (name: string) => {
    pipe(
      projectState.activeSet,
      O.map((characterSet) => projectState.renameSet(characterSet.id, name)),
    );
  };

  const handleEditorModeChange = (mode: CharacterEditorMode) => {
    composeState.closeSpriteContextMenu();
    decompositionState.closeDecompositionRegionContextMenu();
    projectState.setEditorMode(mode);
  };

  const handleProjectSpriteSizeChange = (nextSpriteSize: ProjectSpriteSize) => {
    if (
      projectState.projectSpriteSizeLocked === true ||
      projectState.projectSpriteSize === nextSpriteSize
    ) {
      return;
    }

    const currentState = useProjectState.getState();
    const nextSprites = currentState.sprites.map((sprite) =>
      createEmptySpriteTile(nextSpriteSize, sprite.paletteIndex),
    );
    const nextScreen = {
      ...currentState.screen,
      sprites: [],
    };
    const nextNes = mergeScreenIntoNesOam(
      {
        ...currentState.nes,
        ppuControl: {
          ...currentState.nes.ppuControl,
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
    composeState.clearSelectionAndDrag();
    decompositionState.clearRegionsAndSelection();
  };

  const handleStageWidthChange = (rawValue: string) => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextWidth = clamp(
      parsed.value,
      CHARACTER_MODE_STAGE_LIMITS.minWidth,
      CHARACTER_MODE_STAGE_LIMITS.maxWidth,
    );
    stageState.setStageWidthValue(nextWidth);
    decompositionState.resizeToStage(nextWidth, stageState.stageHeight);
    composeState.clampSpritesToStage(nextWidth, stageState.stageHeight);
  };

  const handleStageHeightChange = (rawValue: string) => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextHeight = clamp(
      parsed.value,
      CHARACTER_MODE_STAGE_LIMITS.minHeight,
      CHARACTER_MODE_STAGE_LIMITS.maxHeight,
    );
    stageState.setStageHeightValue(nextHeight);
    decompositionState.resizeToStage(stageState.stageWidth, nextHeight);
    composeState.clampSpritesToStage(stageState.stageWidth, nextHeight);
  };

  return {
    compose: {
      handleComposeCanvasRef: composeState.handleComposeCanvasRef,
      handleComposeContextMenu: composeState.handleComposeContextMenu,
      handleStageKeyDown: composeState.handleStageKeyDown,
      spriteMenu: {
        closeSpriteContextMenu: composeState.closeSpriteContextMenu,
        handleDeleteContextMenuSprite:
          composeState.handleDeleteContextMenuSprite,
        handleShiftContextMenuSpriteLayer:
          composeState.handleShiftContextMenuSpriteLayer,
        spriteContextMenu: composeState.spriteContextMenu,
      },
    },
    decomposition: {
      canvas: {
        decompositionCanvasCursor: decompositionState.decompositionCanvasCursor,
        handleDecompositionCanvasPointerDown:
          decompositionState.handleDecompositionCanvasPointerDown,
        handleDecompositionCanvasRef:
          decompositionState.handleDecompositionCanvasRef,
      },
      palette: {
        decompositionColorIndex: decompositionState.decompositionColorIndex,
        decompositionPaletteIndex: decompositionState.decompositionPaletteIndex,
        handleDecompositionColorSlotSelect:
          decompositionState.handleDecompositionColorSlotSelect,
        handleDecompositionPaletteSelect:
          decompositionState.handleDecompositionPaletteSelect,
        spritePalettes: projectState.spritePalettes,
      },
      regionMenu: {
        closeDecompositionRegionContextMenu:
          decompositionState.closeDecompositionRegionContextMenu,
        decompositionRegionContextMenu:
          decompositionState.decompositionRegionContextMenu,
        handleDeleteContextMenuRegion:
          decompositionState.handleDeleteContextMenuRegion,
      },
      regions: {
        decompositionAnalysis: decompositionState.decompositionAnalysis,
        decompositionInvalidRegionCount:
          decompositionState.decompositionInvalidRegionCount,
        decompositionRegions: decompositionState.decompositionRegions,
        decompositionValidRegionCount:
          decompositionState.decompositionValidRegionCount,
        handleApplyDecomposition: decompositionState.handleApplyDecomposition,
        handleDecompositionRegionContextMenu:
          decompositionState.handleDecompositionRegionContextMenu,
        handleDecompositionRegionPointerDown:
          decompositionState.handleDecompositionRegionPointerDown,
        handleRemoveSelectedRegion:
          decompositionState.handleRemoveSelectedRegion,
        handleSelectRegion: decompositionState.handleSelectRegion,
        selectedRegionAnalysis: decompositionState.selectedRegionAnalysis,
        selectedRegionId: decompositionState.selectedRegionId,
      },
      tool: {
        decompositionTool: decompositionState.decompositionTool,
        handleDecompositionToolChange:
          decompositionState.handleDecompositionToolChange,
        projectSpriteSize: projectState.projectSpriteSize,
      },
    },
    library: {
      getSpriteTile: composeState.getSpriteTile,
      handleLibraryPointerDown: composeState.handleLibraryPointerDown,
      isLibraryDraggable: composeState.isLibraryDraggable,
      isSpriteDragging: composeState.isSpriteDragging,
      libraryDragState: composeState.libraryDragState,
      sprites: projectState.sprites,
    },
    project: {
      activeSet: projectState.activeSet,
      activeSetId: projectState.activeSetId,
      activeSetName: projectState.activeSetName,
      activeSetSpriteCount: projectState.activeSetSpriteCount,
      characterSets: projectState.characterSets,
      editorMode: {
        handleChange: handleEditorModeChange,
        value: projectState.editorMode,
      },
      projectActions: projectState.projectActions,
      selectedCharacterId: projectState.selectedCharacterId,
      setDraft: {
        handleCreateSet,
        handleNewNameChange: projectState.setNewName,
        newName: projectState.newName,
      },
      setNaming: {
        handleSetNameChange,
      },
      setSelection: {
        handleDeleteSet,
        handleSelectSet,
      },
      spriteSize: {
        handleProjectSpriteSizeChange,
        projectSpriteSize: projectState.projectSpriteSize,
        projectSpriteSizeLocked: projectState.projectSpriteSizeLocked,
      },
    },
    stage: {
      activeSetName: projectState.activeSetName,
      activeSetSpriteCount: projectState.activeSetSpriteCount,
      focusStageElement: stageState.focusStageElement,
      handleStageHeightChange,
      handleStageRef: stageState.handleStageRef,
      handleStageWidthChange,
      handleViewportPointerDown: stageState.handleViewportPointerDown,
      handleViewportPointerEnd: stageState.handleViewportPointerEnd,
      handleViewportPointerMove: stageState.handleViewportPointerMove,
      handleViewportRef: stageState.handleViewportRef,
      handleViewportWheel: stageState.handleViewportWheel,
      handleZoomIn: stageState.handleZoomIn,
      handleZoomOut: stageState.handleZoomOut,
      isStageDropActive: composeState.isStageDropActive,
      selectedSpriteStageMetadata: composeState.selectedSpriteStageMetadata,
      stageHeight: stageState.stageHeight,
      stageScale: stageState.stageScale,
      stageWidth: stageState.stageWidth,
      stageZoomLevel: stageState.stageZoomLevel,
      viewportPanState: stageState.viewportPanState,
    },
    workspace: workspaceState,
  };
};

export type { CharacterModeState } from "./characterModeStateTypes";
