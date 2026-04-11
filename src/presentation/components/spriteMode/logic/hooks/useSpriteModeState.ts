import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo, useState } from "react";
import {
  type ColorIndexOfPalette,
  getHexArrayForSpriteTile,
  type PaletteIndex,
  type ProjectSpriteSize,
  type ProjectStoreState,
  type SpriteTile,
  useProjectState,
} from "../../../../../application/state/projectStore";
import { mergeScreenIntoNesOam } from "../../../../../domain/screen/oamSync";
import { makeTile } from "../../../../../domain/tiles/utils";
import { type Tool } from "../../../../../infrastructure/browser/canvas/useSpriteCanvas";
import useExportImage from "../../../../../infrastructure/browser/useExportImage";
import useImportImage from "../../../../../infrastructure/browser/useImportImage";
import { getArrayItem } from "../../../../../shared/arrayAccess";
import { type FileShareAction } from "../../../common/logic/state/fileMenuState";

function makeEmptyTile(
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile {
  return makeTile(height, paletteIndex, 0);
}

function toPaletteIndex(index: number): PaletteIndex | false {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }
  return false;
}

interface CreateSpriteModeProjectActionsDependencies {
  exportChr: (tile: SpriteTile, paletteIndex: PaletteIndex) => void;
  exportPng: (hexArray: string[][]) => void;
  exportSvgSimple: (hexArray: string[][]) => void;
  exportJSON: (projectState: ProjectStoreState) => void;
  getActivePalette: () => PaletteIndex;
  getActiveSprite: () => number;
  getProjectState: () => ProjectStoreState;
}

const resolveSpriteTileForExport = (
  projectState: ProjectStoreState,
  activeSprite: number,
  activePalette: PaletteIndex,
): SpriteTile =>
  pipe(
    getArrayItem(projectState.sprites, activeSprite),
    O.getOrElse(() => makeEmptyTile(projectState.spriteSize, activePalette)),
  );

export const createSpriteModeProjectActions = ({
  exportChr,
  exportPng,
  exportSvgSimple,
  exportJSON,
  getActivePalette,
  getActiveSprite,
  getProjectState,
}: CreateSpriteModeProjectActionsDependencies): ReadonlyArray<FileShareAction> => [
  {
    id: "share-export-chr",
    label: "CHRエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteTileForExport(
        projectState,
        activeSprite,
        activePalette,
      );

      exportChr(tile, activePalette);
    },
  },
  {
    id: "share-export-png",
    label: "PNGエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteTileForExport(
        projectState,
        activeSprite,
        activePalette,
      );

      exportPng(getHexArrayForSpriteTile(tile));
    },
  },
  {
    id: "share-export-svg",
    label: "SVGエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteTileForExport(
        projectState,
        activeSprite,
        activePalette,
      );

      exportSvgSimple(getHexArrayForSpriteTile(tile));
    },
  },
  {
    id: "share-save-project",
    label: "保存",
    onSelect: () => {
      exportJSON(getProjectState());
    },
  },
];

/**
 * スプライト編集画面の内部 state を組み立てます。
 * 共有状態と操作を provider 専用にまとめています。
 */
export const useSpriteModeInternalState = () => {
  const [tool, setTool] = useState<Tool>("pen");
  const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false);
  const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
  const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);
  const [activeSprite, setActiveSprite] = useState<number>(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const projectSpriteSize = useProjectState((state) => state.spriteSize);
  const activeTile = useProjectState((state) =>
    pipe(
      getArrayItem(state.sprites, activeSprite),
      O.getOrElse(() => makeEmptyTile(projectSpriteSize, activePalette)),
    ),
  );
  const palettes = useProjectState((state) => state.nes.spritePalettes);
  const sprites = useProjectState((state) => state.sprites);
  const screen = useProjectState((state) => state.screen);
  const { exportChr, exportPng, exportSvgSimple, exportJSON } =
    useExportImage();
  const { importJSON } = useImportImage();

  const handleTileChange = (tile: SpriteTile, index: number) => {
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
  };

  const handlePaletteClick = (slot: number) => {
    if (slot !== 0 && slot !== 1 && slot !== 2 && slot !== 3) {
      return;
    }
    setActiveSlot(slot);
  };

  const handleSpriteChange = (index: string) => {
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
  };

  const handlePaletteChange = (index: string) => {
    const nextIndex = Number.parseInt(index, 10);
    const paletteIndex = toPaletteIndex(nextIndex);
    if (paletteIndex === false) {
      return;
    }

    setActivePalette(paletteIndex);
    const nextTile: SpriteTile = { ...activeTile, paletteIndex };
    handleTileChange(nextTile, activeSprite);
  };

  const handleImport = useCallback(async () => {
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
  }, [activeSprite, importJSON]);

  const handleClearSprite = async () => {
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
  };

  const handleToggleTools = () => {
    setIsToolsOpen((previous) => !previous);
  };

  const handleToggleChangeOrderMode = () => {
    setIsChangeOrderMode((previous) => !previous);
  };

  const handleToolChange = (nextTool: Tool) => {
    setTool(nextTool);
  };

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
    activePalette,
    activeSlot,
    activeSprite,
    handleClearSprite,
    handleImport,
    handlePaletteChange,
    handlePaletteClick,
    handleSpriteChange,
    handleTileChange,
    handleToolChange,
    handleToggleChangeOrderMode,
    handleToggleTools,
    isChangeOrderMode,
    isToolsOpen,
    palettes,
    projectActions,
    projectSpriteSize,
    tool,
  };
};

export type SpriteModeState = ReturnType<typeof useSpriteModeInternalState>;
