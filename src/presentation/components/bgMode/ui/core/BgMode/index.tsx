import * as O from "fp-ts/Option";
import React from "react";
import useExportImage from "../../../../../../infrastructure/browser/useExportImage";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { useBgModeWorkspaceEditingState } from "../../../logic/bgModeWorkspaceEditingState";
import { createBgModeWorkspaceProjectActions } from "../../../logic/bgModeWorkspaceProjectActions";
import { BgModeWorkspacePanel } from "../../panels/BgModeWorkspacePanel";

interface BgModeProps {
  render: (params: {
    fileMenuState: FileMenuState;
    panel: React.ReactNode;
  }) => React.ReactNode;
}

/**
 * BG 編集モード全体の UI shell を描画します。
 * domain 未接続の段階では、モック導線とレイアウト確認用の panel を束ねる責務だけを持ちます。
 */
const BgModeComponent: React.FC<BgModeProps> = ({ render }) => {
  const bgModeState = useBgModeWorkspaceEditingState();
  const { exportChr, exportPng, exportSvgSimple } = useExportImage();
  const projectActions = React.useMemo(
    () =>
      createBgModeWorkspaceProjectActions({
        exportChr,
        exportPng,
        exportSvgSimple,
        getActivePaletteIndex: () => bgModeState.activePaletteIndex,
        getSelectedTile: () => bgModeState.selectedTile,
        getSelectedTileIndex: () => bgModeState.selectedTileIndex,
      }),
    [
      bgModeState.activePaletteIndex,
      bgModeState.selectedTile,
      bgModeState.selectedTileIndex,
      exportChr,
      exportPng,
      exportSvgSimple,
    ],
  );
  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions,
      restoreAction: O.none,
    }),
    [projectActions],
  );

  return render({
    fileMenuState,
    panel: <BgModeWorkspacePanel bgModeState={bgModeState} />,
  });
};

export const BgMode = React.memo(BgModeComponent);
