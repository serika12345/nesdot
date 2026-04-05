import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { CharacterModeSetDraftFields } from "./CharacterModeSetDraftFields";
import { CharacterModeSetSelectionFields } from "./CharacterModeSetSelectionFields";

const SetHeaderRow = styled(Stack)(({ theme }) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "row",
  alignItems: "flex-end",
  gap: theme.spacing(2),
}));

const SetHeaderGroup = styled(Stack)(({ theme }) => ({
  minWidth: 0,
  flex: "1 1 0",
  flexDirection: "row",
  alignItems: "flex-end",
  gap: theme.spacing(1.5),
}));

/**
 * キャラクターセットの作成、選択、削除を行うヘッダーです。
 * セット管理の主要操作を横断的にまとめ、ワークスペース上部からすぐ扱えるようにします。
 */
export const CharacterModeSetHeader: React.FC = () => {
  return (
    <SetHeaderRow>
      <SetHeaderGroup>
        <CharacterModeSetDraftFields />
      </SetHeaderGroup>
      <SetHeaderGroup>
        <CharacterModeSetSelectionFields />
      </SetHeaderGroup>
    </SetHeaderRow>
  );
};
