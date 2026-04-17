import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo } from "react";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import {
  selectActiveSetName,
  selectActiveSetSpriteCount,
  selectIsLibraryDraggable,
  selectIsStageDropActive,
  selectProjectSpriteSizeLocked,
  selectSelectedSpriteStageMetadata,
  selectStageScale,
} from "./characterModeSelectors";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import {
  ensureSelectedCharacterSpriteIndex,
  resolveVisibleSpriteContextMenu,
} from "./model/characterEditorModel";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  useProjectState,
  type ProjectState,
} from "../../../../application/state/projectStore";
import { useActiveSet } from "./characterModeShared";
import { useCharacterModeComposeStore } from "./characterModeComposeStore";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";
import { useCharacterModeStageStore } from "./characterModeStageStore";
import { clamp, toNumber } from "./geometry/characterModeBounds";

export const useCharacterModeEditorModeValue = (): Readonly<{
  editorMode: "compose" | "decompose";
}> => {
  const editorMode = useCharacterModeProjectStore((s) => s.editorMode);

  return { editorMode };
};

export const useCharacterModeSpriteMenuState = (): Readonly<{
  closeSpriteContextMenu: () => void;
  spriteContextMenu: O.Option<{
    clientX: number;
    clientY: number;
    spriteEditorIndex: number;
  }>;
}> => {
  const editorMode = useCharacterModeProjectStore((s) => s.editorMode);
  const spriteContextMenuState = useCharacterModeComposeStore(
    (s) => s.spriteContextMenuState,
  );
  const selectedSpriteEditorIndex = useCharacterModeComposeStore(
    (s) => s.selectedSpriteEditorIndex,
  );
  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);

  const spriteContextMenu = useMemo(() => {
    const activeSet = selectActiveSet(characterSets, selectedCharacterId);
    const hasSelectedSprite = pipe(
      activeSet,
      O.chain((characterSet) =>
        pipe(
          ensureSelectedCharacterSpriteIndex(
            selectedSpriteEditorIndex,
            characterSet.sprites.length,
          ),
          O.chain((index) => O.fromNullable(characterSet.sprites[index])),
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
      useCharacterModeComposeStore.getState().closeSpriteContextMenu,
    spriteContextMenu,
  };
};

export const useCharacterModeSpriteMenuActions = (): Readonly<{
  handleDeleteContextMenuSprite: (spriteEditorIndex: number) => void;
  handleShiftContextMenuSpriteLayer: (
    spriteEditorIndex: number,
    amount: number,
  ) => void;
}> => ({
  handleDeleteContextMenuSprite:
    useCharacterModeComposeStore.getState().handleDeleteContextMenuSprite,
  handleShiftContextMenuSpriteLayer:
    useCharacterModeComposeStore.getState().handleShiftContextMenuSpriteLayer,
});

export const useCharacterModeSetDraft = (): Readonly<{
  handleCreateSet: () => void;
  handleNewNameChange: (value: string) => void;
  newName: string;
}> => {
  const newName = useCharacterModeProjectStore((s) => s.newName);

  return {
    handleCreateSet: useCharacterModeProjectStore.getState().handleCreateSet,
    handleNewNameChange: useCharacterModeProjectStore.getState().setNewName,
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
    handleDeleteSet: useCharacterModeProjectStore.getState().handleDeleteSet,
    handleSelectSet: useCharacterModeProjectStore.getState().handleSelectSet,
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
    handleSetNameChange:
      useCharacterModeProjectStore.getState().handleSetNameChange,
  };
};

export const useCharacterModeEditorModeSetting = (): Readonly<{
  editorMode: "compose" | "decompose";
  handleEditorModeChange: (mode: "compose" | "decompose") => void;
}> => {
  const editorMode = useCharacterModeProjectStore((s) => s.editorMode);

  return {
    editorMode,
    handleEditorModeChange:
      useCharacterModeProjectStore.getState().handleEditorModeChange,
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
      useCharacterModeProjectStore.getState().handleProjectSpriteSizeChange,
    projectSpriteSize,
    projectSpriteSizeLocked,
  };
};

export const useCharacterModeSpriteLibrary = (): Readonly<{
  draggingSpriteIndex: number;
  isLibraryDraggable: boolean;
  sprites: ProjectState["sprites"];
  spritePalettes: ProjectState["nes"]["spritePalettes"];
}> => {
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const libraryDragState = useCharacterModeComposeStore(
    (s) => s.libraryDragState,
  );
  const editorMode = useCharacterModeProjectStore((s) => s.editorMode);
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
    isLibraryDraggable: selectIsLibraryDraggable(editorMode, activeSet),
    sprites,
    spritePalettes,
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
  const libraryDragState = useCharacterModeComposeStore(
    (s) => s.libraryDragState,
  );
  const selectedSpriteEditorIndex = useCharacterModeComposeStore(
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
  const stageWidth = useCharacterModeStageStore((s) => s.stageWidth);
  const stageHeight = useCharacterModeStageStore((s) => s.stageHeight);
  const stageZoomLevel = useCharacterModeStageStore((s) => s.stageZoomLevel);
  const stageScale = useMemo(
    () => selectStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );

  const handleStageWidthChange = useCallback((rawValue: string): void => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextWidth = clamp(
      parsed.value,
      CHARACTER_MODE_STAGE_LIMITS.minWidth,
      CHARACTER_MODE_STAGE_LIMITS.maxWidth,
    );
    const currentStageHeight =
      useCharacterModeStageStore.getState().stageHeight;

    useCharacterModeStageStore.getState().setStageWidth(nextWidth);
    useCharacterModeDecompositionStore
      .getState()
      .resizeDecompositionToStage(nextWidth, currentStageHeight);
  }, []);

  const handleStageHeightChange = useCallback((rawValue: string): void => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextHeight = clamp(
      parsed.value,
      CHARACTER_MODE_STAGE_LIMITS.minHeight,
      CHARACTER_MODE_STAGE_LIMITS.maxHeight,
    );
    const currentStageWidth = useCharacterModeStageStore.getState().stageWidth;

    useCharacterModeStageStore.getState().setStageHeight(nextHeight);
    useCharacterModeDecompositionStore
      .getState()
      .resizeDecompositionToStage(currentStageWidth, nextHeight);
  }, []);

  return {
    handleStageHeightChange,
    handleStageWidthChange,
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
  const stageZoomLevel = useCharacterModeStageStore((s) => s.stageZoomLevel);

  return {
    handleZoomIn: useCharacterModeStageStore.getState().handleZoomIn,
    handleZoomOut: useCharacterModeStageStore.getState().handleZoomOut,
    stageZoomLevel,
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
  const viewportPanState = useCharacterModeStageStore(
    (s) => s.viewportPanState,
  );

  return { viewportPanState };
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
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  stageScale: number;
}> => {
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const libraryDragState = useCharacterModeComposeStore(
    (s) => s.libraryDragState,
  );
  const stageWidth = useCharacterModeStageStore((s) => s.stageWidth);
  const stageHeight = useCharacterModeStageStore((s) => s.stageHeight);
  const stageZoomLevel = useCharacterModeStageStore((s) => s.stageZoomLevel);

  const getSpriteTile = useCallback(
    (spriteIndex: number) => O.fromNullable(sprites[spriteIndex]),
    [sprites],
  );

  const stageScale = useMemo(
    () => selectStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );

  return { getSpriteTile, libraryDragState, spritePalettes, stageScale };
};

const selectActiveSet = (
  characterSets: ReadonlyArray<CharacterSet>,
  selectedCharacterId: O.Option<string>,
): O.Option<CharacterSet> =>
  pipe(
    selectedCharacterId,
    O.chain((selectedId) =>
      pipe(
        characterSets.find((characterSet) => characterSet.id === selectedId),
        O.fromNullable,
      ),
    ),
  );
