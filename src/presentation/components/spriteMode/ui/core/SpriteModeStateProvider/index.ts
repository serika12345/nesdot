import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo } from "react";
import {
  type PaletteIndex,
  type ProjectSpriteSize,
  type SpriteTile,
  useProjectState,
} from "../../../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../../../application/state/workbenchStore";
import { mergeScreenIntoNesOam } from "../../../../../../domain/screen/oamSync";
import { makeTile } from "../../../../../../domain/tiles/utils";
import { type Tool } from "../../../../../../infrastructure/browser/canvas/useSpriteCanvas";
import useExportImage from "../../../../../../infrastructure/browser/useExportImage";
import useImportImage from "../../../../../../infrastructure/browser/useImportImage";
import { getArrayItem } from "../../../../../../shared/arrayAccess";
import { type FileShareAction } from "../../../../common/logic/state/fileMenuState";
import {
  createSpriteModeProjectActions,
  resolveSpriteModeTile,
} from "../../../logic/useSpriteModeState";

const makeEmptyTile = (
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile => makeTile(height, paletteIndex, 0);

const toPaletteIndex = (index: number): PaletteIndex | false => {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }

  return false;
};

const useSpriteModeTileChangeAction = () => {
  const sprites = useProjectState((state) => state.sprites);
  const screen = useProjectState((state) => state.screen);

  return useCallback(
    (tile: SpriteTile, index: number): void => {
      const nextSprites = sprites.map((sprite, spriteIndex) =>
        spriteIndex === index ? tile : sprite,
      );
      useProjectState.setState({ sprites: nextSprites });

      const nextScreen = {
        ...screen,
        sprites: screen.sprites.map((screenSprite) =>
          screenSprite.spriteIndex === index
            ? { ...screenSprite, ...tile }
            : screenSprite,
        ),
      };
      const state = useProjectState.getState();
      useProjectState.setState({
        screen: nextScreen,
        nes: mergeScreenIntoNesOam(state.nes, nextScreen),
      });
    },
    [screen, sprites],
  );
};

const useSpriteModeActiveTile = (): SpriteTile => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const projectSpriteSize = useProjectState((state) => state.spriteSize);
  const sprites = useProjectState((state) => state.sprites);

  return useMemo(
    () =>
      resolveSpriteModeTile(
        projectSpriteSize,
        sprites,
        activeSprite,
        activePalette,
      ),
    [activePalette, activeSprite, projectSpriteSize, sprites],
  );
};

const useSpriteModeHandleImport = (): (() => Promise<void>) => {
  const { importJSON } = useImportImage();
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const setActivePalette = useWorkbenchState(
    (state) => state.setSpriteModeActivePalette,
  );

  return useCallback(async () => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        const nextPalette = pipe(
          getArrayItem(data.sprites, activeSprite),
          O.match(
            (): PaletteIndex => 0,
            (sprite): PaletteIndex => sprite.paletteIndex,
          ),
        );
        setActivePalette(nextPalette);
      });
    } catch (error) {
      alert(`インポートに失敗しました: ${String(error)}`);
    }
  }, [activeSprite, importJSON, setActivePalette]);
};

export const useSpriteModeProjectActions = (): Readonly<{
  handleImport: () => Promise<void>;
  projectActions: ReadonlyArray<FileShareAction>;
}> => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const { exportChr, exportPng, exportSvgSimple, exportJSON } =
    useExportImage();
  const handleImport = useSpriteModeHandleImport();

  const projectActions = useMemo<ReadonlyArray<FileShareAction>>(
    () =>
      createSpriteModeProjectActions({
        exportChr,
        exportJSON,
        exportPng,
        exportSvgSimple,
        getActivePalette: () => activePalette,
        getActiveSprite: () => activeSprite,
        getProjectState: useProjectState.getState,
      }),
    [
      activePalette,
      activeSprite,
      exportChr,
      exportJSON,
      exportPng,
      exportSvgSimple,
    ],
  );

  return {
    handleImport,
    projectActions,
  };
};

export const useSpriteModePaletteSlots = (): Readonly<{
  activePalette: PaletteIndex;
  activeSlot: 0 | 1 | 2 | 3;
  handlePaletteClick: (slot: number) => void;
  palettes: ReturnType<
    typeof useProjectState.getState
  >["nes"]["spritePalettes"];
}> => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSlot = useWorkbenchState((state) => state.spriteMode.activeSlot);
  const setActiveSlot = useWorkbenchState(
    (state) => state.setSpriteModeActiveSlot,
  );
  const palettes = useProjectState((state) => state.nes.spritePalettes);

  const handlePaletteClick = useCallback(
    (slot: number): void => {
      if (slot !== 0 && slot !== 1 && slot !== 2 && slot !== 3) {
        return;
      }

      setActiveSlot(slot);
    },
    [setActiveSlot],
  );

  return {
    activePalette,
    activeSlot,
    handlePaletteClick,
    palettes,
  };
};

export const useSpriteModeSelection = (): Readonly<{
  activePalette: PaletteIndex;
  activeSprite: number;
  handlePaletteChange: (index: string) => void;
  handleSpriteChange: (index: string) => void;
  palettes: ReturnType<
    typeof useProjectState.getState
  >["nes"]["spritePalettes"];
}> => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const setActivePalette = useWorkbenchState(
    (state) => state.setSpriteModeActivePalette,
  );
  const setActiveSprite = useWorkbenchState(
    (state) => state.setSpriteModeActiveSprite,
  );
  const palettes = useProjectState((state) => state.nes.spritePalettes);
  const sprites = useProjectState((state) => state.sprites);
  const activeTile = useSpriteModeActiveTile();
  const handleTileChange = useSpriteModeTileChangeAction();

  const handleSpriteChange = useCallback(
    (index: string): void => {
      const nextIndex = Number.parseInt(index, 10);
      if (nextIndex < 0 || nextIndex >= 64 || Number.isNaN(nextIndex)) {
        return;
      }

      setActiveSprite(nextIndex);
      const targetSpriteOption = getArrayItem(sprites, nextIndex);
      if (O.isNone(targetSpriteOption)) {
        return;
      }

      setActivePalette(targetSpriteOption.value.paletteIndex);
    },
    [setActivePalette, setActiveSprite, sprites],
  );

  const handlePaletteChange = useCallback(
    (index: string): void => {
      const nextIndex = Number.parseInt(index, 10);
      const paletteIndex = toPaletteIndex(nextIndex);
      if (paletteIndex === false) {
        return;
      }

      setActivePalette(paletteIndex);
      const nextTile: SpriteTile = { ...activeTile, paletteIndex };
      handleTileChange(nextTile, activeSprite);
    },
    [activeSprite, activeTile, handleTileChange, setActivePalette],
  );

  return {
    activePalette,
    activeSprite,
    handlePaletteChange,
    handleSpriteChange,
    palettes,
  };
};

export const useSpriteModeProjectSpriteSize = (): Readonly<{
  projectSpriteSize: ProjectSpriteSize;
}> => {
  const projectSpriteSize = useProjectState((state) => state.spriteSize);

  return { projectSpriteSize };
};

export const useSpriteModeToolsVisibility = (): Readonly<{
  handleToggleTools: () => void;
  isToolsOpen: boolean;
}> => {
  const isToolsOpen = useWorkbenchState(
    (state) => state.spriteMode.isToolsOpen,
  );
  const handleToggleTools = useWorkbenchState(
    (state) => state.toggleSpriteModeToolsOpen,
  );

  return {
    handleToggleTools,
    isToolsOpen,
  };
};

export const useSpriteModeCanvasTarget = (): Readonly<{
  activeSprite: number;
}> => {
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );

  return { activeSprite };
};

export const useSpriteModeCanvasPaint = (): Readonly<{
  activePalette: PaletteIndex;
  activeSlot: 0 | 1 | 2 | 3;
  handleTileChange: (tile: SpriteTile, index: number) => void;
  tool: Tool;
}> => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSlot = useWorkbenchState((state) => state.spriteMode.activeSlot);
  const tool = useWorkbenchState((state) => state.spriteMode.tool);
  const handleTileChange = useSpriteModeTileChangeAction();

  return {
    activePalette,
    activeSlot,
    handleTileChange,
    tool,
  };
};

export const useSpriteModeChangeOrder = (): Readonly<{
  handleToggleChangeOrderMode: () => void;
  isChangeOrderMode: boolean;
}> => {
  const isChangeOrderMode = useWorkbenchState(
    (state) => state.spriteMode.isChangeOrderMode,
  );
  const handleToggleChangeOrderMode = useWorkbenchState(
    (state) => state.toggleSpriteModeChangeOrderMode,
  );

  return {
    handleToggleChangeOrderMode,
    isChangeOrderMode,
  };
};

export const useSpriteModeToolActions = (): Readonly<{
  handleClearSprite: () => Promise<void>;
  handleToolChange: (nextTool: Tool) => void;
  tool: Tool;
}> => {
  const tool = useWorkbenchState((state) => state.spriteMode.tool);
  const setTool = useWorkbenchState((state) => state.setSpriteModeTool);
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const activeTile = useSpriteModeActiveTile();
  const handleTileChange = useSpriteModeTileChangeAction();

  const handleClearSprite = useCallback(async (): Promise<void> => {
    const message = "本当にクリアしますか？";
    const shouldClear = await tauriConfirm(message, {
      title: "スプライトをクリア",
      okLabel: "クリア",
      cancelLabel: "キャンセル",
    }).catch(() => window.confirm(message));

    if (shouldClear === true) {
      handleTileChange(
        makeEmptyTile(activeTile.height, activeTile.paletteIndex),
        activeSprite,
      );
    }
  }, [activeSprite, activeTile, handleTileChange]);

  const handleToolChange = useCallback(
    (nextTool: Tool): void => {
      setTool(nextTool);
    },
    [setTool],
  );

  return {
    handleClearSprite,
    handleToolChange,
    tool,
  };
};
