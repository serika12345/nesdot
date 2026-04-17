import React from "react";
import { useSpriteModeCanvasPanelState } from "../../logic/spriteModeCanvasState";
import { useSpriteModeEditorPanelState } from "../../logic/spriteModeEditorState";
import { SpriteModeCanvasPanel } from "../panels/SpriteModeCanvasPanel";
import { SpriteModeEditorPanel } from "../panels/SpriteModeEditorPanel";
import { SpriteModeWorkspace } from "./SpriteModeWorkspace";

/**
 * spriteMode の state と UI を接続する画面境界です。
 * focused hook をここで組み立て、子コンポーネントへは役割単位の props だけを渡します。
 */
export const SpriteModeScreen: React.FC = () => {
  const editorPanelState = useSpriteModeEditorPanelState();
  const canvasPanelState = useSpriteModeCanvasPanelState();

  return (
    <SpriteModeWorkspace
      canvasPanel={
        <SpriteModeCanvasPanel canvasPanelState={canvasPanelState} />
      }
      editorPanel={
        <SpriteModeEditorPanel editorPanelState={editorPanelState} />
      }
    />
  );
};
