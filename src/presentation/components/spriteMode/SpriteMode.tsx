import React from "react";
import { SplitLayout } from "../../App.styles";
import { SpriteModeCanvasPanel } from "./SpriteModeCanvasPanel";
import { SpriteModeEditorPanel } from "./SpriteModeEditorPanel";
import { SpriteModeStateProvider } from "./SpriteModeStateProvider";

/**
 * スプライト編集モード全体の UI を描画します。
 * 個別スプライト編集、パレット選択、書き出し、並べ替えを一つの画面にまとめるコンポーネントです。
 */
export const SpriteMode: React.FC = () => {
  return (
    <SpriteModeStateProvider>
      <SplitLayout flex={1} height="100%">
        <SpriteModeEditorPanel />
        <SpriteModeCanvasPanel />
      </SplitLayout>
    </SpriteModeStateProvider>
  );
};
