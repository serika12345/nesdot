import React from "react";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { useScreenModeState } from "../../../logic/hooks/useScreenModeState";
import { ScreenModeWorkspacePanel } from "../../panels/ScreenModeWorkspacePanel";

interface ScreenModeProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * スクリーン配置モード全体の UI を描画します。
 * 左カラム編集を廃止し、ジェスチャー中心ワークスペースへ集約します。
 */
const ScreenModeComponent: React.FC<ScreenModeProps> = ({
  onFileMenuStateChange,
}) => {
  const screenMode = useScreenModeState();

  return (
    <ScreenModeWorkspacePanel
      screenMode={screenMode}
      onFileMenuStateChange={onFileMenuStateChange}
    />
  );
};

export const ScreenMode = React.memo(ScreenModeComponent);
