import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import React from "react";
import { CharacterModeSidebarLibrary } from "../CharacterModeSidebarLibrary";

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
  const sidebarSections = React.Children.toArray(children);

  return (
    <Stack
      role="complementary"
      aria-label="キャラクター編集サイドバー"
      height="100%"
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      {sidebarSections.map((child, index) => (
        <Box key={`sidebar-section-${index}`} flexShrink={0} minWidth={0}>
          {child}
        </Box>
      ))}
      <Box flexShrink={0} minWidth={0}>
        <CharacterModeSidebarLibrary />
      </Box>
    </Stack>
  );
};
