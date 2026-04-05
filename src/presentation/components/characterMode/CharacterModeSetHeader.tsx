import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { CharacterModeSetDraftFields } from "./CharacterModeSetDraftFields";
import { CharacterModeSetSelectionFields } from "./CharacterModeSetSelectionFields";

const ResponsiveHeaderGrid = styled(Stack)({
  flexDirection: "column",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "0.75rem",
  "@media (min-width: 1200px)": {
    flexDirection: "row",
    alignItems: "end",
  },
});

/**
 * キャラクターセットの作成、選択、削除を行うヘッダーです。
 * セット管理の主要操作を横断的にまとめ、ワークスペース上部からすぐ扱えるようにします。
 */
export const CharacterModeSetHeader: React.FC = () => {
  return (
    <ResponsiveHeaderGrid>
      <CharacterModeSetDraftFields />
      <CharacterModeSetSelectionFields />
    </ResponsiveHeaderGrid>
  );
};
