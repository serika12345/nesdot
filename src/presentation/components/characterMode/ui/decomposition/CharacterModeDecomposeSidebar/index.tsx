import React from "react";
import { CharacterModeDecompositionInspector } from "../CharacterModeDecompositionInspector";
import { CharacterModeSidebar } from "../../sidebar/CharacterModeSidebar";

/**
 * キャラクター分解モードの左サイドバーを描画します。
 * 合成モードと同じカラム内に、分解専用の操作カードを積み増します。
 */
export const CharacterModeDecomposeSidebar: React.FC = () => {
  return (
    <CharacterModeSidebar>
      <CharacterModeDecompositionInspector />
    </CharacterModeSidebar>
  );
};
