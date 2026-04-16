import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { create } from "zustand";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  useProjectState,
  type PaletteIndex,
} from "../../../../application/state/projectStore";
import {
  applyCharacterDecomposition,
  type CharacterDecompositionCanvas,
  type CharacterDecompositionPixel,
  type CharacterDecompositionRegion,
} from "../../../../domain/characters/characterDecomposition";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import { selectActiveSet } from "./characterModeSelectors";
import { useCharacterModeStageStore } from "./characterModeStageStore";
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
import {
  type DecompositionDrawState,
  type DecompositionRegionContextMenuState,
  type DecompositionRegionDragState,
} from "./types/characterModeInteractionState";
import { type DecompositionTool } from "../ui/primitives/CharacterModePrimitives";

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

export interface CharacterModeDecompositionStoreState {
  decompositionTool: DecompositionTool;
  decompositionPaletteIndex: PaletteIndex;
  decompositionColorIndex: 1 | 2 | 3;
  decompositionCanvas: CharacterDecompositionCanvas;
  decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>;
  selectedRegionId: O.Option<string>;
  decompositionRegionContextMenuState: O.Option<DecompositionRegionContextMenuState>;
  decompositionDrawState: O.Option<DecompositionDrawState>;
  decompositionRegionDragState: O.Option<DecompositionRegionDragState>;
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
}

export const useCharacterModeDecompositionStore =
  create<CharacterModeDecompositionStoreState>()((set, get) => ({
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
      const { stageWidth, stageHeight } = useCharacterModeStageStore.getState();
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
        decompositionCanvas,
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
        decompositionCanvas: paintDecompositionPixel(
          decompositionCanvas,
          x,
          y,
          nextPixel,
        ),
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
      const { decompositionCanvas, decompositionRegions } = get();
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
              canvas: decompositionCanvas,
              regions: [...decompositionRegions],
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
              characterSets: state.characterSets.map((currentSet) =>
                currentSet.id === characterSet.id
                  ? { ...currentSet, sprites: result.right.characterSprites }
                  : currentSet,
              ),
            }));

            return true;
          },
        ),
      );
    },

    resizeDecompositionToStage: (nextWidth, nextHeight) => {
      const { decompositionCanvas, decompositionRegions } = get();
      const projectSpriteSize = useProjectState.getState().spriteSize;

      set({
        decompositionCanvas: resizeDecompositionCanvas(
          decompositionCanvas,
          nextWidth,
          nextHeight,
        ),
        decompositionRegions: clampDecompositionRegions(
          [...decompositionRegions],
          nextWidth,
          nextHeight,
          projectSpriteSize,
        ),
      });
    },
  }));
