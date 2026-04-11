import { Stack } from "@mui/material";
import React from "react";
import {
  CHARACTER_SIDEBAR_CLASS_NAME,
  mergeClassNames,
} from "../../../styleClassNames";
import { CharacterModeSidebarLibrary } from "./CharacterModeSidebarLibrary";

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
    <Stack
      className={mergeClassNames(CHARACTER_SIDEBAR_CLASS_NAME)}
      role="complementary"
      aria-label="キャラクター編集サイドバー"
      height="100%"
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      {children}
      <CharacterModeSidebarLibrary />
    </Stack>
  );
};
