import * as O from "fp-ts/Option";
import { create } from "zustand";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import { clamp } from "./geometry/characterModeBounds";
import { type ViewportPanState } from "./types/characterModeInteractionState";

export interface CharacterModeStageStoreState {
  stageWidth: number;
  stageHeight: number;
  stageZoomLevel: number;
  viewportPanState: O.Option<ViewportPanState>;
  setStageWidth: (nextWidth: number) => void;
  setStageHeight: (nextHeight: number) => void;
  setStageZoomLevel: (nextZoom: number) => void;
  setViewportPanState: (state: O.Option<ViewportPanState>) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export const useCharacterModeStageStore =
  create<CharacterModeStageStoreState>()((set, get) => ({
    stageWidth: CHARACTER_MODE_STAGE_LIMITS.initialWidth,
    stageHeight: CHARACTER_MODE_STAGE_LIMITS.initialHeight,
    stageZoomLevel: CHARACTER_MODE_STAGE_LIMITS.defaultZoomLevel,
    viewportPanState: O.none,

    setStageWidth: (nextWidth) => set({ stageWidth: nextWidth }),
    setStageHeight: (nextHeight) => set({ stageHeight: nextHeight }),
    setStageZoomLevel: (nextZoom) => set({ stageZoomLevel: nextZoom }),
    setViewportPanState: (state) => set({ viewportPanState: state }),

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
  }));
