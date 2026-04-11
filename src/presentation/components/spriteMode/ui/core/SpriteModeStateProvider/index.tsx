import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  type SpriteModeState,
  useSpriteModeInternalState,
} from "../../../logic/hooks/useSpriteModeState";

const noop = (): void => {};
const noopAsync = async (): Promise<void> => {};
const noopString = (value: string): void => {
  void value;
};
const noopNumber = (value: number): void => {
  void value;
};

const SpriteModeStateContext = React.createContext<O.Option<SpriteModeState>>(
  O.none,
);

const useSpriteModeSlice = <T,>(
  pick: (state: SpriteModeState) => T,
  fallback: T,
): T => {
  const state = React.useContext(SpriteModeStateContext);

  return pipe(
    state,
    O.match(
      () => fallback,
      (value) => pick(value),
    ),
  );
};

interface SpriteModeStateProviderProps {
  children: React.ReactNode;
}

export const SpriteModeStateProvider: React.FC<
  SpriteModeStateProviderProps
> = ({ children }) => {
  const value = useSpriteModeInternalState();

  return (
    <SpriteModeStateContext.Provider value={O.some(value)}>
      {children}
    </SpriteModeStateContext.Provider>
  );
};

type SpriteModeProjectActionsSlice = Pick<
  SpriteModeState,
  "handleImport" | "projectActions"
>;

const defaultSpriteModeProjectActions: SpriteModeProjectActionsSlice = {
  handleImport: noopAsync,
  projectActions: [],
};

export const useSpriteModeProjectActions = (): SpriteModeProjectActionsSlice =>
  useSpriteModeSlice(
    (state) => ({
      handleImport: state.handleImport,
      projectActions: state.projectActions,
    }),
    defaultSpriteModeProjectActions,
  );

type SpriteModePaletteSlotsSlice = Pick<
  SpriteModeState,
  "activePalette" | "activeSlot" | "handlePaletteClick" | "palettes"
>;

const defaultSpriteModePaletteSlots: SpriteModePaletteSlotsSlice = {
  activePalette: 0,
  activeSlot: 1,
  handlePaletteClick: noopNumber,
  palettes: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

export const useSpriteModePaletteSlots = (): SpriteModePaletteSlotsSlice =>
  useSpriteModeSlice(
    (state) => ({
      activePalette: state.activePalette,
      activeSlot: state.activeSlot,
      handlePaletteClick: state.handlePaletteClick,
      palettes: state.palettes,
    }),
    defaultSpriteModePaletteSlots,
  );

type SpriteModeSelectionSlice = Pick<
  SpriteModeState,
  | "activePalette"
  | "activeSprite"
  | "handlePaletteChange"
  | "handleSpriteChange"
  | "palettes"
>;

const defaultSpriteModeSelection: SpriteModeSelectionSlice = {
  activePalette: 0,
  activeSprite: 0,
  handlePaletteChange: noopString,
  handleSpriteChange: noopString,
  palettes: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

export const useSpriteModeSelection = (): SpriteModeSelectionSlice =>
  useSpriteModeSlice(
    (state) => ({
      activePalette: state.activePalette,
      activeSprite: state.activeSprite,
      handlePaletteChange: state.handlePaletteChange,
      handleSpriteChange: state.handleSpriteChange,
      palettes: state.palettes,
    }),
    defaultSpriteModeSelection,
  );

type SpriteModeProjectSpriteSizeSlice = Pick<
  SpriteModeState,
  "projectSpriteSize"
>;

const defaultSpriteModeProjectSpriteSize: SpriteModeProjectSpriteSizeSlice = {
  projectSpriteSize: 8,
};

export const useSpriteModeProjectSpriteSize =
  (): SpriteModeProjectSpriteSizeSlice =>
    useSpriteModeSlice(
      (state) => ({
        projectSpriteSize: state.projectSpriteSize,
      }),
      defaultSpriteModeProjectSpriteSize,
    );

type SpriteModeToolsVisibilitySlice = Pick<
  SpriteModeState,
  "handleToggleTools" | "isToolsOpen"
>;

const defaultSpriteModeToolsVisibility: SpriteModeToolsVisibilitySlice = {
  handleToggleTools: noop,
  isToolsOpen: false,
};

export const useSpriteModeToolsVisibility =
  (): SpriteModeToolsVisibilitySlice =>
    useSpriteModeSlice(
      (state) => ({
        handleToggleTools: state.handleToggleTools,
        isToolsOpen: state.isToolsOpen,
      }),
      defaultSpriteModeToolsVisibility,
    );

type SpriteModeCanvasTargetSlice = Pick<SpriteModeState, "activeSprite">;

const defaultSpriteModeCanvasTarget: SpriteModeCanvasTargetSlice = {
  activeSprite: 0,
};

export const useSpriteModeCanvasTarget = (): SpriteModeCanvasTargetSlice =>
  useSpriteModeSlice(
    (state) => ({
      activeSprite: state.activeSprite,
    }),
    defaultSpriteModeCanvasTarget,
  );

type SpriteModeCanvasPaintSlice = Pick<
  SpriteModeState,
  "activePalette" | "activeSlot" | "handleTileChange" | "tool"
>;

const defaultSpriteModeCanvasPaint: SpriteModeCanvasPaintSlice = {
  activePalette: 0,
  activeSlot: 1,
  handleTileChange: noop,
  tool: "pen",
};

export const useSpriteModeCanvasPaint = (): SpriteModeCanvasPaintSlice =>
  useSpriteModeSlice(
    (state) => ({
      activePalette: state.activePalette,
      activeSlot: state.activeSlot,
      handleTileChange: state.handleTileChange,
      tool: state.tool,
    }),
    defaultSpriteModeCanvasPaint,
  );

type SpriteModeChangeOrderSlice = Pick<
  SpriteModeState,
  "handleToggleChangeOrderMode" | "isChangeOrderMode"
>;

const defaultSpriteModeChangeOrder: SpriteModeChangeOrderSlice = {
  handleToggleChangeOrderMode: noop,
  isChangeOrderMode: false,
};

export const useSpriteModeChangeOrder = (): SpriteModeChangeOrderSlice =>
  useSpriteModeSlice(
    (state) => ({
      handleToggleChangeOrderMode: state.handleToggleChangeOrderMode,
      isChangeOrderMode: state.isChangeOrderMode,
    }),
    defaultSpriteModeChangeOrder,
  );

type SpriteModeToolActionsSlice = Pick<
  SpriteModeState,
  "handleClearSprite" | "handleToolChange" | "tool"
>;

const defaultSpriteModeToolActions: SpriteModeToolActionsSlice = {
  handleClearSprite: noopAsync,
  handleToolChange: noop,
  tool: "pen",
};

export const useSpriteModeToolActions = (): SpriteModeToolActionsSlice =>
  useSpriteModeSlice(
    (state) => ({
      handleClearSprite: state.handleClearSprite,
      handleToolChange: state.handleToolChange,
      tool: state.tool,
    }),
    defaultSpriteModeToolActions,
  );
