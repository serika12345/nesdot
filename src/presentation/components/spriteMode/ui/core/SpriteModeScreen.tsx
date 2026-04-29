import React from "react";
import { useSpriteModeCanvasPanelState } from "../../logic/spriteModeCanvasState";
import { useSpriteModeLibraryPanelState } from "../../logic/spriteModeLibraryState";
import { SpriteModeCanvasPanel } from "../panels/SpriteModeCanvasPanel";
import { SpriteModeLibraryPanel } from "../panels/SpriteModeLibraryPanel";
import styles from "./SpriteModeScreen.module.css";

/**
 * spriteMode の state と UI を接続する画面境界です。
 * focused hook をここで組み立て、子コンポーネントへは役割単位の props だけを渡します。
 */
export const SpriteModeScreen: React.FC = () => {
  const libraryPanelState = useSpriteModeLibraryPanelState();
  const canvasPanelState = useSpriteModeCanvasPanelState();

  return (
    <section className={styles.root} aria-label="スプライト編集ワークスペース">
      <SpriteModeLibraryPanel libraryPanelState={libraryPanelState} />
      <SpriteModeCanvasPanel canvasPanelState={canvasPanelState} />
    </section>
  );
};
