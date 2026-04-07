import React from "react";
import { type FileMenuState } from "../common/fileMenuState";
import { useScreenModeState } from "./hooks/useScreenModeState";
import { ScreenModePreviewPanel } from "./ScreenModePreviewPanel";

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
    <ScreenModePreviewPanel
      screenMode={screenMode}
      onFileMenuStateChange={onFileMenuStateChange}
    />
  );
};

export const ScreenMode = React.memo(ScreenModeComponent);
