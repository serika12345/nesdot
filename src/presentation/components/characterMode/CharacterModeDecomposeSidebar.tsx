import React from "react";
import { CharacterModeDecompositionInspector } from "./CharacterModeDecompositionInspector";
import {
  CharacterModeSidebarContent,
  CharacterModeSidebarRoot,
} from "./CharacterModeSidebar";

/**
 * キャラクター分解モードの左サイドバーを描画します。
 * 合成モードと同じカラム内に、分解専用の操作カードを積み増します。
 */
export const CharacterModeDecomposeSidebar: React.FC = () => {
  return (
    <CharacterModeSidebarRoot
      role="complementary"
      aria-label="キャラクター編集サイドバー"
      height="100%"
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      <CharacterModeDecompositionInspector />
      <CharacterModeSidebarContent />
    </CharacterModeSidebarRoot>
  );
};
