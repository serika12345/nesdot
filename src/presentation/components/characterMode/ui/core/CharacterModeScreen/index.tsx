import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import { CharacterModeSetDraftFields } from "../../set/CharacterModeSetDraftFields";
import { CharacterModeSetSelectionFields } from "../../set/CharacterModeSetSelectionFields";
import { CharacterModeSidebarEditorModeCard } from "../../sidebar/CharacterModeSidebarEditorModeCard";
import { CharacterModeSidebarSpriteSizeCard } from "../../sidebar/CharacterModeSidebarSpriteSizeCard";
import { CharacterModeGestureWorkspace } from "../CharacterModeGestureWorkspace";

/**
 * キャラクター編集画面の shell を描画します。
 * 操作列、ワークスペース、コンテキストメニューの配置だけを担当します。
 */
export const CharacterModeScreen: React.FC = () => {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      flex={1}
      minHeight={0}
      height="100%"
      spacing="0.875rem"
      p="1.125rem"
      useFlexGap
    >
      <Stack
        useFlexGap
        width="100%"
        minWidth={0}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        flexWrap="wrap"
      >
        <Stack
          useFlexGap
          minWidth={0}
          direction="row"
          alignItems="center"
          spacing={1}
          flexWrap="wrap"
        >
          <CharacterModeSidebarEditorModeCard />
          <CharacterModeSidebarSpriteSizeCard />
          <CharacterModeSetDraftFields />
        </Stack>
        <Stack
          useFlexGap
          minWidth={0}
          flex="1 1 24rem"
          direction="row"
          alignItems="flex-end"
          justifyContent="flex-end"
          spacing={1}
        >
          <CharacterModeSetSelectionFields />
        </Stack>
      </Stack>

      <CharacterModeGestureWorkspace />
    </Stack>
  );
};
