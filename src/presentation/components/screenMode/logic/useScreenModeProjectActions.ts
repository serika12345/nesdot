import * as O from "fp-ts/Option";
import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  getHexArrayForScreen,
  useProjectState,
  type ProjectStoreState,
} from "../../../../application/state/projectStore";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import useImportImage from "../../../../infrastructure/browser/useImportImage";
import { type FileShareAction } from "../../common/logic/state/fileMenuState";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";

type ProjectActionItem = FileShareAction;

interface CreateScreenModeProjectActionsDependencies {
  exportPng: (hexArray: string[][]) => void;
  exportSvgSimple: (hexArray: string[][]) => void;
  exportJSON: (projectState: ProjectStoreState) => void;
  getProjectState: () => ProjectStoreState;
}

type ScreenModeProjectActionsDependencies = Pick<
  ScreenModeProjectStateResult,
  "scan"
> & {
  setSelectedSpriteIndex: Dispatch<SetStateAction<O.Option<number>>>;
};

interface ScreenModeProjectActionsResult {
  projectActions: ProjectActionItem[];
  handleImport: () => Promise<void>;
}

export const createScreenModeProjectActions = ({
  exportPng,
  exportSvgSimple,
  exportJSON,
  getProjectState,
}: CreateScreenModeProjectActionsDependencies): ProjectActionItem[] => [
  {
    id: "share-export-png",
    label: "PNGエクスポート",
    onSelect: () => {
      exportPng(getHexArrayForScreen(getProjectState().screen));
    },
  },
  {
    id: "share-export-svg",
    label: "SVGエクスポート",
    onSelect: () => {
      exportSvgSimple(getHexArrayForScreen(getProjectState().screen));
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
 * `screenMode` の保存・エクスポート・インポート導線を扱います。
 */
export const useScreenModeProjectActions = ({
  scan,
  setSelectedSpriteIndex,
}: ScreenModeProjectActionsDependencies): ScreenModeProjectActionsResult => {
  const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
  const { importJSON } = useImportImage();

  const handleImport = useCallback(async (): Promise<void> => {
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
  }, [importJSON, scan, setSelectedSpriteIndex]);

  const projectActions = useMemo<ProjectActionItem[]>(
    () =>
      createScreenModeProjectActions({
        exportJSON,
        exportPng,
        exportSvgSimple,
        getProjectState: useProjectState.getState,
      }),
    [exportJSON, exportPng, exportSvgSimple],
  );

  return {
    projectActions,
    handleImport,
  };
};
