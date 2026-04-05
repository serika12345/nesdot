import { Stack } from "@mui/material";
import React from "react";
import { CharacterModeDecompositionRegionListCard } from "./CharacterModeDecompositionRegionListCard";
import { CharacterModeSelectedRegionCard } from "./CharacterModeSelectedRegionCard";

/**
 * キャラクター分解モード用のインスペクタを描画します。
 * 選択領域の詳細、適用可否、領域一覧をまとめて表示し、分解結果を確認しやすくする役割があります。
 */
export const CharacterModeDecompositionInspector: React.FC = () => {
  return (
    <Stack
      minWidth={0}
      minHeight={0}
      spacing="1rem"
      overflow="auto"
      pr="0.25rem"
    >
      <CharacterModeSelectedRegionCard />
      <CharacterModeDecompositionRegionListCard />
    </Stack>
  );
};
