import * as O from "fp-ts/Option";
import React from "react";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { useScreenModeState } from "../../../logic/useScreenModeState";
import { ScreenModeWorkspacePanel } from "../../panels/ScreenModeWorkspacePanel";

interface ScreenModeProps {
  render: (params: {
    fileMenuState: FileMenuState;
    panel: React.ReactNode;
  }) => React.ReactNode;
}

/**
 * スクリーン配置モード全体の UI を描画します。
 * 左カラム編集を廃止し、ジェスチャー中心ワークスペースへ集約します。
 */
const ScreenModeComponent: React.FC<ScreenModeProps> = ({ render }) => {
  const screenMode = useScreenModeState();
  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: screenMode.projectActions,
      restoreAction: O.some({
        label: "復元",
        onSelect: screenMode.handleImport,
      }),
    }),
    [screenMode.handleImport, screenMode.projectActions],
  );

  return render({
    fileMenuState,
    panel: <ScreenModeWorkspacePanel screenMode={screenMode} />,
  });
};

export const ScreenMode = React.memo(ScreenModeComponent);
