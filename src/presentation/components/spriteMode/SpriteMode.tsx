import React from "react";
import { SplitLayout } from "../../App.styles";
import { type FileMenuState } from "../common/fileMenuState";
import { SpriteModeCanvasPanel } from "./SpriteModeCanvasPanel";
import { SpriteModeEditorPanel } from "./SpriteModeEditorPanel";
import { SpriteModeStateProvider } from "./SpriteModeStateProvider";

interface SpriteModeProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

/**
 * スプライト編集モード全体の UI を描画します。
 * 個別スプライト編集、パレット選択、書き出し、並べ替えを一つの画面にまとめるコンポーネントです。
 */
const SpriteModeComponent: React.FC<SpriteModeProps> = ({
  onFileMenuStateChange,
}) => {
  return (
    <SpriteModeStateProvider>
      <SplitLayout flex={1} height="100%">
        <SpriteModeEditorPanel />
        <SpriteModeCanvasPanel onFileMenuStateChange={onFileMenuStateChange} />
      </SplitLayout>
    </SpriteModeStateProvider>
  );
};

export const SpriteMode = React.memo(SpriteModeComponent);
