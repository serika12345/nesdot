import React from "react";
import { ScreenModeWorkspacePanel } from "../../panels/ScreenModeWorkspacePanel";

/**
 * スクリーン配置モード全体の UI を描画します。
 * 左カラム編集を廃止し、ジェスチャー中心ワークスペースへ集約します。
 */
const ScreenModeComponent: React.FC = () => {
  return <ScreenModeWorkspacePanel />;
};

export const ScreenMode = React.memo(ScreenModeComponent);
