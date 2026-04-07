import * as O from "fp-ts/Option";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import {
  getHexArrayForScreen,
  useProjectState,
} from "../../../../application/state/projectStore";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import useImportImage from "../../../../infrastructure/browser/useImportImage";
import { type FileShareAction } from "../../common/fileMenuState";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

type ProjectActionItem = FileShareAction;

type ScreenModeProjectActionsDependencies = Pick<
  ScreenModeProjectStateResult,
  "screen" | "projectState" | "scan"
> & {
  setSelectedSpriteIndex: Dispatch<SetStateAction<O.Option<number>>>;
};

export interface ScreenModeProjectActionsResult {
  projectActions: ProjectActionItem[];
  handleImport: () => Promise<void>;
}

/**
 * `screenMode` の保存・エクスポート・インポート導線を扱います。
 */
export const useScreenModeProjectActions = ({
  screen,
  projectState,
  scan,
  setSelectedSpriteIndex,
}: ScreenModeProjectActionsDependencies): ScreenModeProjectActionsResult => {
  const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
  const { importJSON } = useImportImage();

  const handleImport = async (): Promise<void> => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        setSelectedSpriteIndex(
          data.screen.sprites.length > 0 ? O.some(0) : O.none,
        );

        const result = scan(data.screen, syncedNes);
        if (result.ok === false) {
          alert(
            "インポートしたデータに制約違反があります:\n" +
              result.errors.join("\n"),
          );
        }
      });
    } catch (error) {
      alert("インポートに失敗しました: " + String(error));
    }
  };

  const projectActions = useMemo<ProjectActionItem[]>(
    () => [
      {
        id: "share-export-png",
        label: "PNGエクスポート",
        onSelect: () => exportPng(getHexArrayForScreen(screen)),
      },
      {
        id: "share-export-svg",
        label: "SVGエクスポート",
        onSelect: () => exportSvgSimple(getHexArrayForScreen(screen)),
      },
      {
        id: "share-save-project",
        label: "保存",
        onSelect: () => exportJSON(projectState),
      },
    ],
    [exportJSON, exportPng, exportSvgSimple, projectState, screen],
  );

  return {
    projectActions,
    handleImport,
  };
};
