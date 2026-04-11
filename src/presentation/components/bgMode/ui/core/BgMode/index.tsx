import React from "react";
import { type FileMenuState } from "../../../../common/logic/state/fileMenuState";
import { BgModeWorkspacePanel } from "../../panels/BgModeWorkspacePanel";

interface BgModeProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * BG 編集モード全体の UI shell を描画します。
 * domain 未接続の段階では、モック導線とレイアウト確認用の panel を束ねる責務だけを持ちます。
 */
const BgModeComponent: React.FC<BgModeProps> = ({ onFileMenuStateChange }) => {
  return <BgModeWorkspacePanel onFileMenuStateChange={onFileMenuStateChange} />;
};

export const BgMode = React.memo(BgModeComponent);
