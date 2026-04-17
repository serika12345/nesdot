import React from "react";
import { BgModeScreen } from "./BgModeScreen";

/**
 * BG 編集モード全体の UI shell を描画します。
 * 画面 shell の接続だけを担当します。
 */
const BgModeComponent: React.FC = () => {
  return <BgModeScreen />;
};

export const BgMode = React.memo(BgModeComponent);
