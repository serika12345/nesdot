import React from "react";
import { BgModeWorkspacePanel } from "../../panels/BgModeWorkspacePanel";

/**
 * BG 編集モード全体の UI shell を描画します。
 * domain 未接続の段階では、モック導線とレイアウト確認用の panel を束ねる責務だけを持ちます。
 */
const BgModeComponent: React.FC = () => {
  return <BgModeWorkspacePanel />;
};

export const BgMode = React.memo(BgModeComponent);
