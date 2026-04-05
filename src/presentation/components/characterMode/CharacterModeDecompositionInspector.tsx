import React from "react";
import { CharacterModeDecompositionRegionListCard } from "./CharacterModeDecompositionRegionListCard";
import { CharacterModeSelectedRegionCard } from "./CharacterModeSelectedRegionCard";

/**
 * キャラクター分解モード用の詳細カード群を描画します。
 * 選択領域の詳細、適用可否、領域一覧をまとめて表示します。
 */
export const CharacterModeDecompositionInspector: React.FC = () => {
  return (
    <>
      <CharacterModeSelectedRegionCard />
      <CharacterModeDecompositionRegionListCard />
    </>
  );
};
