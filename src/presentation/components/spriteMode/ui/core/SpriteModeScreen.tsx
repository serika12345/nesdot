import React from "react";
import { useSpriteModeCanvasPanelState } from "../../logic/spriteModeCanvasState";
import { useSpriteModeLibraryPanelState } from "../../logic/spriteModeLibraryState";
import { SpriteModeCanvasPanel } from "../panels/SpriteModeCanvasPanel";
import { SpriteModeLibraryPanel } from "../panels/SpriteModeLibraryPanel";
import { SpriteModeWorkspace } from "./SpriteModeWorkspace";

/**
 * spriteMode の state と UI を接続する画面境界です。
 * focused hook をここで組み立て、子コンポーネントへは役割単位の props だけを渡します。
 */
export const SpriteModeScreen: React.FC = () => {
  const libraryPanelState = useSpriteModeLibraryPanelState();
  const canvasPanelState = useSpriteModeCanvasPanelState();

  return (
    <SpriteModeWorkspace
      libraryPanel={
        <SpriteModeLibraryPanel libraryPanelState={libraryPanelState} />
      }
      canvasPanel={
        <SpriteModeCanvasPanel canvasPanelState={canvasPanelState} />
      }
    />
  );
};
