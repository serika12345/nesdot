import Stack from "@mui/material/Stack";
import React from "react";
import { CharacterModeSetSelectionFields } from "./CharacterModeSetSelectionFields";

/**
 * キャラクターセットの選択、名前変更、削除を行うヘッダーです。
 * セット管理の主要操作を横断的にまとめ、ワークスペース上部からすぐ扱えるようにします。
 */
export const CharacterModeSetHeader: React.FC = () => {
  return (
    <Stack
      useFlexGap
      width="100%"
      minWidth={0}
      direction="row"
      alignItems="flex-end"
      spacing={2}
    >
      <Stack
        useFlexGap
        minWidth={0}
        flex="1 1 0"
        direction="row"
        alignItems="flex-end"
        spacing={1.5}
      >
        <CharacterModeSetSelectionFields />
      </Stack>
    </Stack>
  );
};
