import Stack from "@mui/material/Stack";
import React from "react";
import { SpriteModeCanvasPanel } from "../../panels/SpriteModeCanvasPanel";
import { SpriteModeEditorPanel } from "../../panels/SpriteModeEditorPanel";

/**
 * スプライト編集モード全体の UI を描画します。
 * 個別スプライト編集、パレット選択、書き出し、並べ替えを一つの画面にまとめるコンポーネントです。
 */
const SpriteModeComponent: React.FC = () => {
  return (
    <Stack
      useFlexGap
      direction={{ xs: "column", lg: "row" }}
      spacing="1rem"
      minHeight={0}
      flex={1}
      height="100%"
    >
      <SpriteModeEditorPanel />
      <SpriteModeCanvasPanel />
    </Stack>
  );
};

export const SpriteMode = React.memo(SpriteModeComponent);
