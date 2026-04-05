import React from "react";
import { CharacterModeScreen } from "./CharacterModeScreen";
import { CharacterModeStateProvider } from "./CharacterModeStateProvider";

/**
 * キャラクター編集モード全体の UI を描画します。
 * 状態 provider と画面 shell の接続だけを担当します。
 */
export const CharacterMode: React.FC = () => {
  return (
    <CharacterModeStateProvider>
      <CharacterModeScreen />
    </CharacterModeStateProvider>
  );
};
