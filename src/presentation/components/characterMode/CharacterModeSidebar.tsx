import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { CharacterModeSidebarEditorModeCard } from "./CharacterModeSidebarEditorModeCard";
import { CharacterModeSidebarLibrary } from "./CharacterModeSidebarLibrary";
import { CharacterModeSidebarSetNameCard } from "./CharacterModeSidebarSetNameCard";
import { CharacterModeSidebarSpriteSizeCard } from "./CharacterModeSidebarSpriteSizeCard";

const SidebarRoot = styled(Stack)({
  "& > *": {
    flexShrink: 0,
  },
});

/**
 * キャラクター編集ワークスペースの共通サイドバーを描画します。
 * モード切替、セット名、スプライト単位、ライブラリ一覧をまとめて扱います。
 */
export const CharacterModeSidebar: React.FC = () => {
  return (
    <SidebarRoot
      role="complementary"
      aria-label="キャラクター編集サイドバー"
      height="100%"
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      <CharacterModeSidebarSetNameCard />
      <CharacterModeSidebarEditorModeCard />
      <CharacterModeSidebarSpriteSizeCard />
      <CharacterModeSidebarLibrary />
    </SidebarRoot>
  );
};
