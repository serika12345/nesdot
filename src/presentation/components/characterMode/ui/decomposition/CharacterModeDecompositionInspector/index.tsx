import React from "react";
import { CharacterModeSelectedRegionCard } from "../../selection/CharacterModeSelectedRegionCard";

/**
 * キャラクター分解モード用の詳細カード群を描画します。
 * 選択領域の詳細と適用可否をまとめて表示します。
 */
export const CharacterModeDecompositionInspector: React.FC = () => {
  return (
    <>
      <CharacterModeSelectedRegionCard />
    </>
  );
};
