import React from "react";
import { useScreenModeState } from "./hooks/useScreenModeState";
import { ScreenModePreviewPanel } from "./ScreenModePreviewPanel";

/**
 * スクリーン配置モード全体の UI を描画します。
 * 左カラム編集を廃止し、ジェスチャー中心ワークスペースへ集約します。
 */
export const ScreenMode: React.FC = () => {
  const screenMode = useScreenModeState();

  return <ScreenModePreviewPanel screenMode={screenMode} />;
};
