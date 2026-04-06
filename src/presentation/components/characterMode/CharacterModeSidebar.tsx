import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { CharacterModeSidebarLibrary } from "./CharacterModeSidebarLibrary";

export const CharacterModeSidebarRoot = styled(Stack)({
  "& > *": {
    flexShrink: 0,
  },
});

export const CharacterModeSidebarContent = React.memo(
  function CharacterModeSidebarContent() {
    return (
      <>
        <CharacterModeSidebarLibrary />
      </>
    );
  },
);

interface CharacterModeSidebarProps {
  children?: React.ReactNode;
}

/**
 * キャラクター編集ワークスペースの共通サイドバーを描画します。
 * ライブラリ一覧をまとめて扱います。
 */
export const CharacterModeSidebar: React.FC<CharacterModeSidebarProps> = ({
  children,
}) => {
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
      <CharacterModeSidebarContent />
      {children}
    </CharacterModeSidebarRoot>
  );
};
