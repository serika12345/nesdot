import React from "react";
import { CharacterComposeWorkspaceGrid } from "./CharacterModePrimitives";
import { CharacterModeDecomposeSidebar } from "./CharacterModeDecomposeSidebar";
import { CharacterModeDecomposePreviewCanvas } from "./CharacterModeDecomposePreviewCanvas";

/**
 * キャラクター分解モードのワークスペースを描画します。
 * 合成モードと同じ 2 カラム構成で、左サイドバーと中央プレビューを並べます。
 */
export const CharacterModeDecomposeWorkspace: React.FC = () => {
  return (
    <CharacterComposeWorkspaceGrid
      aria-label="キャラクター編集ワークスペース"
      flex={1}
    >
      <CharacterModeDecomposeSidebar />

      <CharacterModeDecomposePreviewCanvas />
    </CharacterComposeWorkspaceGrid>
  );
};
