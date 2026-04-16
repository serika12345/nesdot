import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { useMemo } from "react";
import { useProjectState } from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import { decodeBackgroundTileAtIndex } from "../../../../domain/nes/backgroundEditing";
import { createEmptyBackgroundTile } from "../../../../domain/project/projectV2";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import {
  type FileMenuState,
  emptyFileMenuState,
} from "../../common/logic/state/fileMenuState";
import { createBgModeWorkspaceProjectActions } from "./bgModeWorkspaceProjectActions";

const useSelectedBackgroundTile = () => {
  const chrBytes = useProjectState((state) => state.nes.chrBytes);
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );

  return useMemo(() => {
    const decodedTile = decodeBackgroundTileAtIndex(
      chrBytes,
      selectedTileIndex,
    );
    return E.isRight(decodedTile)
      ? decodedTile.right
      : createEmptyBackgroundTile();
  }, [chrBytes, selectedTileIndex]);
};

export const useBgModeFileMenuState = (): FileMenuState => {
  const selectedTile = useSelectedBackgroundTile();
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
