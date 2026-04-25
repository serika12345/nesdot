import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { type SpriteModeCanvasPanelState } from "../../logic/spriteModeCanvasState";
import { SpriteModeCanvasSurface } from "../canvas/SpriteModeCanvasSurface";
import { SpriteModePaletteSlots } from "../forms/SpriteModePaletteSlots";
import { SpriteModeToolOverlay } from "../overlay/SpriteModeToolOverlay";
import styles from "./SpriteModeCanvasPanel.module.css";

interface SpriteModeCanvasPanelProps {
  canvasPanelState: SpriteModeCanvasPanelState;
}

/**
 * スプライト編集の右ペインです。
 * 色スロット、ツール、canvas を 1 つの編集面としてまとめます。
 */
export const SpriteModeCanvasPanel: React.FC<SpriteModeCanvasPanelProps> = ({
  canvasPanelState,
}) => {
  return (
    <SurfaceCard
      role="region"
      aria-label="スプライトキャンバスパネル"
      className={styles.root}
    >
      <SpriteModePaletteSlots
        activePalette={canvasPanelState.paletteSlots.activePalette}
        activeSlot={canvasPanelState.paletteSlots.activeSlot}
        handlePaletteChange={canvasPanelState.paletteSlots.handlePaletteChange}
        palettes={canvasPanelState.paletteSlots.palettes}
        onPaletteClick={canvasPanelState.paletteSlots.handlePaletteClick}
      />

      <SurfaceCard className={styles.surface}>
        <SpriteModeToolOverlay toolOverlay={canvasPanelState.toolOverlay} />
        <SpriteModeCanvasSurface
          canvasSurface={canvasPanelState.canvasSurface}
        />
      </SurfaceCard>
    </SurfaceCard>
  );
};
