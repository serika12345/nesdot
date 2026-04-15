import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { create } from "zustand";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  useProjectState,
  type PaletteIndex,
  type ProjectSpriteSize,
} from "../../../../application/state/projectStore";
import {
  applyCharacterDecomposition,
  type CharacterDecompositionCanvas,
  type CharacterDecompositionPixel,
  type CharacterDecompositionRegion,
} from "../../../../domain/characters/characterDecomposition";
import { createEmptySpriteTile } from "../../../../domain/project/project";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import { type DecompositionTool } from "../ui/primitives/CharacterModePrimitives";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import {
  selectActiveSet,
  selectActiveSetId,
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
} from "./characterModeSelectors";
import {
  createDecompositionCanvas,
  paintDecompositionPixel,
  resizeDecompositionCanvas,
  TRANSPARENT_DECOMPOSITION_PIXEL,
} from "./decomposition/decompositionCanvas";
import {
  clampDecompositionRegion,
  clampDecompositionRegions,
} from "./decomposition/decompositionRegionRules";
import { clamp, isInRange, toNumber } from "./geometry/characterModeBounds";
import {
  getNextCharacterSpriteLayer,
  nudgeCharacterSprite,
  resolveSelectionAfterSpriteRemoval,
  shiftCharacterSpriteLayer,
} from "./model/characterEditorModel";
import { isProjectSpriteSizeLocked } from "./project/projectSpriteSizeLock";
import {
  type DecompositionDrawState,
  type DecompositionRegionContextMenuState,
  type DecompositionRegionDragState,
  type LibraryDragState,
  type SpriteContextMenuState,
  type ViewportPanState,
} from "./types/characterModeInteractionState";
import { type CharacterEditorMode } from "./view/characterEditorMode";

// ---------------------------------------------------------------------------
// Store state interface
// ---------------------------------------------------------------------------

interface CharacterModeStoreState {
  // --- project slice ---
  editorMode: CharacterEditorMode;
  newName: string;

  // --- stage slice ---
  stageWidth: number;
  stageHeight: number;
  stageZoomLevel: number;
  viewportPanState: O.Option<ViewportPanState>;

  // --- compose slice ---
  libraryDragState: O.Option<LibraryDragState>;
  selectedSpriteEditorIndex: O.Option<number>;
  spriteContextMenuState: O.Option<SpriteContextMenuState>;

  // --- decomposition slice ---
  decompositionTool: DecompositionTool;
  decompositionPaletteIndex: PaletteIndex;
  decompositionColorIndex: 1 | 2 | 3;
  decompositionCanvas: CharacterDecompositionCanvas;
  decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>;
  selectedRegionId: O.Option<string>;
  decompositionRegionContextMenuState: O.Option<DecompositionRegionContextMenuState>;
  decompositionDrawState: O.Option<DecompositionDrawState>;
  decompositionRegionDragState: O.Option<DecompositionRegionDragState>;
}

interface CharacterModeStoreActions {
  // --- project actions ---
  setEditorMode: (mode: CharacterEditorMode) => void;
  setNewName: (value: string) => void;
  handleCreateSet: () => void;
  handleSelectSet: (value: string) => void;
  handleDeleteSet: (setId: string) => void;
  handleSetNameChange: (name: string) => void;
  handleEditorModeChange: (mode: CharacterEditorMode) => void;
  handleProjectSpriteSizeChange: (nextSpriteSize: ProjectSpriteSize) => void;

  // --- stage actions ---
  setStageWidth: (nextWidth: number) => void;
  setStageHeight: (nextHeight: number) => void;
  setStageZoomLevel: (nextZoom: number) => void;
  setViewportPanState: (state: O.Option<ViewportPanState>) => void;
  handleStageWidthChange: (rawValue: string) => void;
  handleStageHeightChange: (rawValue: string) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;

  // --- compose actions ---
  setLibraryDragState: (state: O.Option<LibraryDragState>) => void;
  setSelectedSpriteEditorIndex: (index: O.Option<number>) => void;
  setSpriteContextMenuState: (state: O.Option<SpriteContextMenuState>) => void;
  clearSelectionAndDrag: () => void;
  closeSpriteContextMenu: () => void;
  handleDeleteContextMenuSprite: (spriteEditorIndex: number) => void;
  handleShiftContextMenuSpriteLayer: (
    spriteEditorIndex: number,
    amount: number,
  ) => void;
  handleNudgeSelectedSprite: (
    direction: "left" | "right" | "up" | "down",
  ) => void;
  handleDeleteSelectedSprite: () => void;
  handleDropSpriteOnStage: (
    spriteIndex: number,
    stageX: number,
    stageY: number,
  ) => void;

  // --- decomposition actions ---
  setDecompositionTool: (tool: DecompositionTool) => void;
  setDecompositionPaletteIndex: (index: PaletteIndex) => void;
  setDecompositionColorIndex: (index: 1 | 2 | 3) => void;
  setDecompositionRegions: (
    regions: ReadonlyArray<CharacterDecompositionRegion>,
  ) => void;
  setSelectedRegionId: (id: O.Option<string>) => void;
  setDecompositionRegionContextMenuState: (
    state: O.Option<DecompositionRegionContextMenuState>,
  ) => void;
  setDecompositionDrawState: (state: O.Option<DecompositionDrawState>) => void;
  setDecompositionRegionDragState: (
    state: O.Option<DecompositionRegionDragState>,
  ) => void;
  clearSelectedRegion: () => void;
  clearRegionsAndSelection: () => void;
  closeDecompositionRegionContextMenu: () => void;
  handleDecompositionPaletteSelect: (value: string | number) => void;
  handleDecompositionColorSlotSelect: (slotIndex: 1 | 2 | 3) => void;
  handleSelectRegion: (regionId: string) => void;
  handleRemoveSelectedRegion: () => void;
  handleDeleteContextMenuRegion: (regionId: string) => void;
  handlePlaceDecompositionRegion: (x: number, y: number) => void;
  handlePaintDecompositionPixel: (x: number, y: number) => void;
  handleMoveDecompositionRegion: (
    regionId: string,
    x: number,
    y: number,
  ) => void;
  handleApplyDecomposition: () => boolean;
  resizeDecompositionToStage: (nextWidth: number, nextHeight: number) => void;

  // --- workspace actions ---
  handleWorkspacePointerDownCapture: (isInsideContextMenu: boolean) => void;
}

export type CharacterModeStore = CharacterModeStoreState &
  CharacterModeStoreActions;

// ---------------------------------------------------------------------------
// Pure helpers (no store dependency)
// ---------------------------------------------------------------------------

const removeRegionById = (
  regions: ReadonlyArray<CharacterDecompositionRegion>,
  regionId: string,
): ReadonlyArray<CharacterDecompositionRegion> =>
  regions.filter((region) => region.id !== regionId);

const resolveNextSelectedRegion = (
  current: O.Option<string>,
  removedId: string,
): O.Option<string> =>
  pipe(
    current,
    O.chain((selectedId) =>
      selectedId === removedId ? O.none : O.some(selectedId),
    ),
  );

const parsePaletteIndex = (value: string | number): O.Option<PaletteIndex> => {
  const parsed = Number(String(value));
  if (parsed === 0 || parsed === 1 || parsed === 2 || parsed === 3) {
    return O.some(parsed);
  }
  return O.none;
};

const createRegionId = (): string =>
  ["region", `${Date.now()}`, `${Math.random()}`].join("-");

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

const INITIAL_STATE: CharacterModeStoreState = {
  editorMode: "compose",
  newName: "New Character",

  stageWidth: CHARACTER_MODE_STAGE_LIMITS.initialWidth,
  stageHeight: CHARACTER_MODE_STAGE_LIMITS.initialHeight,
  stageZoomLevel: CHARACTER_MODE_STAGE_LIMITS.defaultZoomLevel,
  viewportPanState: O.none,

  libraryDragState: O.none,
  selectedSpriteEditorIndex: O.none,
  spriteContextMenuState: O.none,

  decompositionTool: "pen",
  decompositionPaletteIndex: 0,
  decompositionColorIndex: 1,
  decompositionCanvas: createDecompositionCanvas(
    CHARACTER_MODE_STAGE_LIMITS.initialWidth,
    CHARACTER_MODE_STAGE_LIMITS.initialHeight,
  ),
  decompositionRegions: [],
  selectedRegionId: O.none,
  decompositionRegionContextMenuState: O.none,
  decompositionDrawState: O.none,
  decompositionRegionDragState: O.none,
};

export const useCharacterModeStore = create<CharacterModeStore>()(
  (set, get) => ({
    ...INITIAL_STATE,

    // -----------------------------------------------------------------------
    // project actions
    // -----------------------------------------------------------------------
    setEditorMode: (mode) => set({ editorMode: mode }),
    setNewName: (value) => set({ newName: value }),

    handleCreateSet: () => {
      const { newName } = get();
      useCharacterState.getState().createSet({ name: newName });
      set({
        libraryDragState: O.none,
        selectedSpriteEditorIndex: O.none,
        spriteContextMenuState: O.none,
        selectedRegionId: O.none,
      });
    },

    handleSelectSet: (value) => {
      useCharacterState
        .getState()
        .selectSet(value === "" ? O.none : O.some(value));
      set({
        libraryDragState: O.none,
        selectedSpriteEditorIndex: O.none,
        spriteContextMenuState: O.none,
        selectedRegionId: O.none,
      });
    },

    handleDeleteSet: (setId) => {
      useCharacterState.getState().deleteSet(setId);
      set({
        libraryDragState: O.none,
        selectedSpriteEditorIndex: O.none,
        spriteContextMenuState: O.none,
        selectedRegionId: O.none,
      });
    },

    handleSetNameChange: (name) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      pipe(
        activeSet,
        O.map((cs) => characterState.renameSet(cs.id, name)),
      );
    },

    handleEditorModeChange: (mode) => {
      set({
        editorMode: mode,
        spriteContextMenuState: O.none,
        decompositionRegionContextMenuState: O.none,
      });
    },

    handleProjectSpriteSizeChange: (nextSpriteSize) => {
      const characterState = useCharacterState.getState();
      const projectState = useProjectState.getState();
      const locked = isProjectSpriteSizeLocked(
        projectState.sprites,
        projectState.screen.sprites.length,
        characterState.characterSets,
      );

      if (locked === true || projectState.spriteSize === nextSpriteSize) {
        return;
      }

      const nextSprites = projectState.sprites.map((sprite) =>
        createEmptySpriteTile(nextSpriteSize, sprite.paletteIndex),
      );
      const nextScreen = {
        ...projectState.screen,
        sprites: [],
      };
      const nextNes = mergeScreenIntoNesOam(
        {
          ...projectState.nes,
          ppuControl: {
            ...projectState.nes.ppuControl,
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
      set({
        libraryDragState: O.none,
        selectedSpriteEditorIndex: O.none,
        spriteContextMenuState: O.none,
        decompositionRegions: [],
        selectedRegionId: O.none,
      });
    },

    // -----------------------------------------------------------------------
    // stage actions
    // -----------------------------------------------------------------------
    setStageWidth: (nextWidth) => set({ stageWidth: nextWidth }),
    setStageHeight: (nextHeight) => set({ stageHeight: nextHeight }),
    setStageZoomLevel: (nextZoom) => set({ stageZoomLevel: nextZoom }),
    setViewportPanState: (state) => set({ viewportPanState: state }),

    handleStageWidthChange: (rawValue) => {
      const parsed = toNumber(rawValue);
      if (O.isNone(parsed)) {
        return;
      }

      const nextWidth = clamp(
        parsed.value,
        CHARACTER_MODE_STAGE_LIMITS.minWidth,
        CHARACTER_MODE_STAGE_LIMITS.maxWidth,
      );
      const {
        stageHeight,
        decompositionCanvas: dc,
        decompositionRegions: dr,
      } = get();
      const projectSpriteSize = useProjectState.getState().spriteSize;

      set({
        stageWidth: nextWidth,
        decompositionCanvas: resizeDecompositionCanvas(
          dc,
          nextWidth,
          stageHeight,
        ),
        decompositionRegions: clampDecompositionRegions(
          [...dr],
          nextWidth,
          stageHeight,
          projectSpriteSize,
        ),
      });
    },

    handleStageHeightChange: (rawValue) => {
      const parsed = toNumber(rawValue);
      if (O.isNone(parsed)) {
        return;
      }

      const nextHeight = clamp(
        parsed.value,
        CHARACTER_MODE_STAGE_LIMITS.minHeight,
        CHARACTER_MODE_STAGE_LIMITS.maxHeight,
      );
      const {
        stageWidth,
        decompositionCanvas: dc,
        decompositionRegions: dr,
      } = get();
      const projectSpriteSize = useProjectState.getState().spriteSize;

      set({
        stageHeight: nextHeight,
        decompositionCanvas: resizeDecompositionCanvas(
          dc,
          stageWidth,
          nextHeight,
        ),
        decompositionRegions: clampDecompositionRegions(
          [...dr],
          stageWidth,
          nextHeight,
          projectSpriteSize,
        ),
      });
    },

    handleZoomIn: () => {
      const { stageZoomLevel } = get();
      set({
        stageZoomLevel: clamp(
          stageZoomLevel + 1,
          CHARACTER_MODE_STAGE_LIMITS.minZoomLevel,
          CHARACTER_MODE_STAGE_LIMITS.maxZoomLevel,
        ),
      });
    },

    handleZoomOut: () => {
      const { stageZoomLevel } = get();
      set({
        stageZoomLevel: clamp(
          stageZoomLevel - 1,
          CHARACTER_MODE_STAGE_LIMITS.minZoomLevel,
          CHARACTER_MODE_STAGE_LIMITS.maxZoomLevel,
        ),
      });
    },

    // -----------------------------------------------------------------------
    // compose actions
    // -----------------------------------------------------------------------
    setLibraryDragState: (state) => set({ libraryDragState: state }),
    setSelectedSpriteEditorIndex: (index) =>
      set({ selectedSpriteEditorIndex: index, spriteContextMenuState: O.none }),
    setSpriteContextMenuState: (state) =>
      set({ spriteContextMenuState: state }),

    clearSelectionAndDrag: () =>
      set({
        selectedSpriteEditorIndex: O.none,
        spriteContextMenuState: O.none,
        libraryDragState: O.none,
      }),

    closeSpriteContextMenu: () => set({ spriteContextMenuState: O.none }),

    handleDeleteContextMenuSprite: (spriteEditorIndex) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      pipe(
        activeSet,
        O.chain((cs) =>
          pipe(
            O.fromNullable(cs.sprites[spriteEditorIndex]),
            O.map(() => ({
              setId: cs.id,
              spriteCount: cs.sprites.length,
            })),
          ),
        ),
        O.map(({ setId, spriteCount }) => {
          characterState.removeSprite(setId, spriteEditorIndex);
          set({
            spriteContextMenuState: O.none,
            selectedSpriteEditorIndex: resolveSelectionAfterSpriteRemoval(
              get().selectedSpriteEditorIndex,
              spriteEditorIndex,
              spriteCount - 1,
            ),
          });
        }),
      );
    },

    handleShiftContextMenuSpriteLayer: (spriteEditorIndex, amount) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      const { stageWidth, stageHeight } = get();
      pipe(
        activeSet,
        O.chain((cs) =>
          pipe(
            O.fromNullable(cs.sprites[spriteEditorIndex]),
            O.map((sprite) => ({ setId: cs.id, sprite })),
          ),
        ),
        O.map(({ setId, sprite }) => {
          const nextSprite = shiftCharacterSpriteLayer(sprite, amount);
          if (
            isInRange(nextSprite.spriteIndex, 0, 63) &&
            isInRange(nextSprite.x, 0, stageWidth - 1) &&
            isInRange(nextSprite.y, 0, stageHeight - 1) &&
            isInRange(nextSprite.layer, 0, 63)
          ) {
            characterState.setSprite(setId, spriteEditorIndex, nextSprite);
          }
        }),
      );
      set({ spriteContextMenuState: O.none });
    },

    handleNudgeSelectedSprite: (direction) => {
      const { selectedSpriteEditorIndex, stageWidth, stageHeight } = get();
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      pipe(
        activeSet,
        O.chain((cs) =>
          pipe(
            selectedSpriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(cs.sprites[index]),
                O.map((sprite) => ({ cs, index, sprite })),
              ),
            ),
          ),
        ),
        O.map(({ cs, index, sprite }) => {
          const nextSprite = nudgeCharacterSprite(
            sprite,
            direction,
            stageWidth - 1,
            stageHeight - 1,
          );
          if (
            isInRange(nextSprite.spriteIndex, 0, 63) &&
            isInRange(nextSprite.x, 0, stageWidth - 1) &&
            isInRange(nextSprite.y, 0, stageHeight - 1) &&
            isInRange(nextSprite.layer, 0, 63)
          ) {
            characterState.setSprite(cs.id, index, nextSprite);
          }
        }),
      );
      set({ spriteContextMenuState: O.none });
    },

    handleDeleteSelectedSprite: () => {
      const { selectedSpriteEditorIndex } = get();
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      pipe(
        activeSet,
        O.chain((cs) =>
          pipe(
            selectedSpriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(cs.sprites[index]),
                O.map(() => ({
                  setId: cs.id,
                  index,
                  spriteCount: cs.sprites.length,
                })),
              ),
            ),
          ),
        ),
        O.map(({ setId, index, spriteCount }) => {
          characterState.removeSprite(setId, index);
          set({
            spriteContextMenuState: O.none,
            selectedSpriteEditorIndex: resolveSelectionAfterSpriteRemoval(
              get().selectedSpriteEditorIndex,
              index,
              spriteCount - 1,
            ),
          });
        }),
      );
    },

    handleDropSpriteOnStage: (spriteIndex, stageX, stageY) => {
      const characterState = useCharacterState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );
      pipe(
        activeSet,
        O.map((cs) => {
          characterState.addSprite(cs.id, {
            spriteIndex,
            x: stageX,
            y: stageY,
            layer: getNextCharacterSpriteLayer(cs.sprites),
          });
          set({
            selectedSpriteEditorIndex: O.some(cs.sprites.length),
            spriteContextMenuState: O.none,
            libraryDragState: O.none,
          });
        }),
      );
    },

    // -----------------------------------------------------------------------
    // decomposition actions
    // -----------------------------------------------------------------------
    setDecompositionTool: (tool) => set({ decompositionTool: tool }),
    setDecompositionPaletteIndex: (index) =>
      set({ decompositionPaletteIndex: index }),
    setDecompositionColorIndex: (index) =>
      set({ decompositionColorIndex: index }),
    setDecompositionRegions: (regions) =>
      set({ decompositionRegions: regions }),
    setSelectedRegionId: (id) => set({ selectedRegionId: id }),
    setDecompositionRegionContextMenuState: (state) =>
      set({ decompositionRegionContextMenuState: state }),
    setDecompositionDrawState: (state) =>
      set({ decompositionDrawState: state }),
    setDecompositionRegionDragState: (state) =>
      set({ decompositionRegionDragState: state }),

    clearSelectedRegion: () => set({ selectedRegionId: O.none }),

    clearRegionsAndSelection: () =>
      set({ decompositionRegions: [], selectedRegionId: O.none }),

    closeDecompositionRegionContextMenu: () =>
      set({ decompositionRegionContextMenuState: O.none }),

    handleDecompositionPaletteSelect: (value) => {
      pipe(
        parsePaletteIndex(value),
        O.map((index) => set({ decompositionPaletteIndex: index })),
      );
    },

    handleDecompositionColorSlotSelect: (slotIndex) => {
      set({ decompositionColorIndex: slotIndex, decompositionTool: "pen" });
    },

    handleSelectRegion: (regionId) => {
      set({ selectedRegionId: O.some(regionId) });
    },

    handleRemoveSelectedRegion: () => {
      const { selectedRegionId, decompositionRegions } = get();
      pipe(
        selectedRegionId,
        O.map((regionId) => {
          set({
            decompositionRegions: removeRegionById(
              decompositionRegions,
              regionId,
            ),
            selectedRegionId: O.none,
            decompositionRegionContextMenuState: O.none,
          });
        }),
      );
    },

    handleDeleteContextMenuRegion: (regionId) => {
      const { decompositionRegions, selectedRegionId } = get();
      set({
        decompositionRegions: removeRegionById(decompositionRegions, regionId),
        selectedRegionId: resolveNextSelectedRegion(selectedRegionId, regionId),
        decompositionRegionContextMenuState: O.none,
      });
    },

    handlePlaceDecompositionRegion: (x, y) => {
      const { stageWidth, stageHeight } = get();
      const projectSpriteSize = useProjectState.getState().spriteSize;
      const nextRegion = clampDecompositionRegion(
        { id: createRegionId(), x, y },
        stageWidth,
        stageHeight,
        projectSpriteSize,
      );
      set((state) => ({
        decompositionRegions: [...state.decompositionRegions, nextRegion],
        selectedRegionId: O.some(nextRegion.id),
      }));
    },

    handlePaintDecompositionPixel: (x, y) => {
      const {
        decompositionTool,
        decompositionPaletteIndex,
        decompositionColorIndex,
        decompositionCanvas: dc,
      } = get();
      const nextPixel: CharacterDecompositionPixel =
        decompositionTool === "eraser"
          ? TRANSPARENT_DECOMPOSITION_PIXEL
          : {
              kind: "color",
              paletteIndex: decompositionPaletteIndex,
              colorIndex: decompositionColorIndex,
            };
      set({
        decompositionCanvas: paintDecompositionPixel(dc, x, y, nextPixel),
      });
    },

    handleMoveDecompositionRegion: (regionId, x, y) => {
      set((state) => ({
        decompositionRegions: state.decompositionRegions.map((region) =>
          region.id === regionId ? { ...region, x, y } : region,
        ),
      }));
    },

    handleApplyDecomposition: () => {
      const { decompositionCanvas: dc, decompositionRegions: dr } = get();
      const characterState = useCharacterState.getState();
      const projectState = useProjectState.getState();
      const activeSet = selectActiveSet(
        characterState.characterSets,
        characterState.selectedCharacterId,
      );

      return pipe(
        activeSet,
        O.match(
          () => false,
          (characterSet) => {
            const result = applyCharacterDecomposition({
              canvas: dc,
              regions: [...dr],
              spriteSize: projectState.spriteSize,
              sprites: projectState.sprites,
            });

            if (E.isLeft(result)) {
              return false;
            }

            const nextScreen = {
              ...projectState.screen,
              sprites: projectState.screen.sprites.map((screenSprite) => {
                const nextTileOption = O.fromNullable(
                  result.right.sprites[screenSprite.spriteIndex],
                );
                if (O.isNone(nextTileOption)) {
                  return screenSprite;
                }
                return { ...screenSprite, ...nextTileOption.value };
              }),
            };

            useProjectState.setState({
              sprites: result.right.sprites,
              screen: nextScreen,
              nes: mergeScreenIntoNesOam(projectState.nes, nextScreen),
            });

            useCharacterState.setState((state) => ({
              characterSets: state.characterSets.map((cs) =>
                cs.id === characterSet.id
                  ? { ...cs, sprites: result.right.characterSprites }
                  : cs,
              ),
            }));

            return true;
          },
        ),
      );
    },

    resizeDecompositionToStage: (nextWidth, nextHeight) => {
      const { decompositionCanvas: dc, decompositionRegions: dr } = get();
      const projectSpriteSize = useProjectState.getState().spriteSize;
      set({
        decompositionCanvas: resizeDecompositionCanvas(
          dc,
          nextWidth,
          nextHeight,
        ),
        decompositionRegions: clampDecompositionRegions(
          [...dr],
          nextWidth,
          nextHeight,
          projectSpriteSize,
        ),
      });
    },

    // -----------------------------------------------------------------------
    // workspace actions
    // -----------------------------------------------------------------------
    handleWorkspacePointerDownCapture: (isInsideContextMenu) => {
      if (isInsideContextMenu === true) {
        return;
      }

      set({
        spriteContextMenuState: O.none,
        decompositionRegionContextMenuState: O.none,
      });
    },
  }),
);

// ---------------------------------------------------------------------------
// Derived selectors for use with useCharacterModeStore(selector)
// ---------------------------------------------------------------------------

export {
  selectActiveSet,
  selectActiveSetId,
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
};
