import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo } from "react";
import {
  getHexArrayForSpriteTile,
  type PaletteIndex,
  type ProjectStoreState,
  type SpriteTile,
  useProjectState,
} from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import { getArrayItem } from "../../../../shared/arrayAccess";
import { type FileShareAction } from "../../common/logic/state/fileMenuState";
import { resolveSpriteModeTile } from "./spriteModeShared";

type ProjectActionItem = FileShareAction;

interface CreateSpriteModeProjectActionsDependencies {
  exportChr: (tile: SpriteTile, paletteIndex: PaletteIndex) => void;
  exportPng: (hexArray: string[][]) => void;
  exportSvgSimple: (hexArray: string[][]) => void;
  exportJSON: (projectState: ProjectStoreState) => void;
  getActivePalette: () => PaletteIndex;
  getActiveSprite: () => number;
  getProjectState: () => ProjectStoreState;
}

interface SpriteModeProjectActionsResult {
  handleImport: () => Promise<void>;
  projectActions: ReadonlyArray<ProjectActionItem>;
}

type ImportImageService = ReturnType<
  (typeof import("../../../../infrastructure/browser/useImportImage"))["default"]
>;

const loadImportImageService = async (): Promise<ImportImageService> => {
  const module =
    await import("../../../../infrastructure/browser/useImportImage");

  return module.default();
};

export const createSpriteModeProjectActions = ({
  exportChr,
  exportPng,
  exportSvgSimple,
  exportJSON,
  getActivePalette,
  getActiveSprite,
  getProjectState,
}: CreateSpriteModeProjectActionsDependencies): ReadonlyArray<ProjectActionItem> => [
  {
    id: "share-export-chr",
    label: "CHRエクスポート",
    onSelect: () => {
      const activePalette = getActivePalette();
      const activeSprite = getActiveSprite();
      const projectState = getProjectState();
      const tile = resolveSpriteModeTile(
        projectState.spriteSize,
        projectState.sprites,
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
      const tile = resolveSpriteModeTile(
        projectState.spriteSize,
        projectState.sprites,
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
      const tile = resolveSpriteModeTile(
        projectState.spriteSize,
        projectState.sprites,
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
 * `spriteMode` の保存・エクスポート・インポート導線を扱います。
 */
export const useSpriteModeProjectActions =
  (): SpriteModeProjectActionsResult => {
    const activePalette = useWorkbenchState(
      (state) => state.spriteMode.activePalette,
    );
    const activeSprite = useWorkbenchState(
      (state) => state.spriteMode.activeSprite,
    );
    const setActivePalette = useWorkbenchState(
      (state) => state.setSpriteModeActivePalette,
    );
    const { exportChr, exportPng, exportSvgSimple, exportJSON } =
      useExportImage();

    const handleImport = useCallback(async (): Promise<void> => {
      try {
        const { importJSON } = await loadImportImageService();

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
    }, [activeSprite, setActivePalette]);

    const projectActions = useMemo<ReadonlyArray<ProjectActionItem>>(
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
