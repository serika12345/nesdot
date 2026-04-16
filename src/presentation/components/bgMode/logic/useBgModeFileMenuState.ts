import * as O from "fp-ts/Option";
import { useMemo } from "react";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import {
  type FileMenuState,
  emptyFileMenuState,
} from "../../common/logic/state/fileMenuState";
import { useBgModeSelectedTile } from "./bgModeWorkspaceEditingState";
import { createBgModeWorkspaceProjectActions } from "./bgModeWorkspaceProjectActions";

export const useBgModeFileMenuState = (): FileMenuState => {
  const selectedTile = useBgModeSelectedTile();
  const activePaletteIndex = useWorkbenchState(
    (state) => state.bgMode.activePaletteIndex,
  );
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );
  const { exportChr, exportPng, exportSvgSimple } = useExportImage();

  const shareActions = useMemo(
    () =>
      createBgModeWorkspaceProjectActions({
        exportChr,
        exportPng,
        exportSvgSimple,
        getActivePaletteIndex: () => activePaletteIndex,
        getSelectedTile: () => selectedTile,
        getSelectedTileIndex: () => selectedTileIndex,
      }),
    [
      activePaletteIndex,
      exportChr,
      exportPng,
      exportSvgSimple,
      selectedTile,
      selectedTileIndex,
    ],
  );

  return useMemo(
    () => ({
      ...emptyFileMenuState,
      shareActions,
      restoreAction: O.none,
    }),
    [shareActions],
  );
};
