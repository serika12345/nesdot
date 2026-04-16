import React from "react";
import { CharacterModeScreen } from "../CharacterModeScreen";

/**
 * キャラクター編集モード全体の UI を描画します。
 * 画面 shell の接続だけを担当します。
 */
const CharacterModeComponent: React.FC = () => {
  return <CharacterModeScreen />;
};

export const CharacterMode = React.memo(CharacterModeComponent);
