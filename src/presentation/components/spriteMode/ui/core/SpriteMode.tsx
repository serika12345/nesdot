import React from "react";
import { SpriteModeScreen } from "./SpriteModeScreen";

/**
 * スプライト編集モード全体の UI を描画します。
 * 画面 shell の接続だけを担当します。
 */
const SpriteModeComponent: React.FC = () => {
  return <SpriteModeScreen />;
};

export const SpriteMode = React.memo(SpriteModeComponent);
