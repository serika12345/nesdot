import React from "react";
import { SplitLayout } from "../../App.styles";
import { ScreenModeEditorPanel } from "./ScreenModeEditorPanel";
import { useScreenModeState } from "./hooks/useScreenModeState";
import { ScreenModePreviewPanel } from "./ScreenModePreviewPanel";

/**
 * スクリーン配置モード全体の UI を描画します。
 * 編集パネルとプレビューパネルを並べ、左側の編集群は単一のスクロール領域に集約します。
 */
export const ScreenMode: React.FC = () => {
  const screenMode = useScreenModeState();

  return (
    <SplitLayout flex={1} height="100%">
      <ScreenModeEditorPanel screenMode={screenMode} />
      <ScreenModePreviewPanel screenMode={screenMode} />
    </SplitLayout>
  );
};
