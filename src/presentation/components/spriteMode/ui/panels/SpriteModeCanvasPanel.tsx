import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { CanvasToolOverlay } from "../../../common/ui/overlay/CanvasToolOverlay";
import { PaletteSlotSelector } from "../../../common/ui/palette/PaletteSlotSelector";
import { type SpriteModeCanvasPanelState } from "../../logic/spriteModeCanvasState";
import { SpriteModeCanvasSurface } from "../canvas/SpriteModeCanvasSurface";
import { SpriteModeToolMenu } from "../menu/SpriteModeToolMenu";
import styles from "./SpriteModeCanvasPanel.module.css";

const DEFAULT_SLOT_COLORS: ReadonlyArray<number> = [0, 0, 0, 0];

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
      <PaletteSlotSelector
        paletteState={{
          activePalette: canvasPanelState.paletteSlots.activePalette,
          activeSlot: canvasPanelState.paletteSlots.activeSlot,
          handlePaletteChange:
            canvasPanelState.paletteSlots.handlePaletteChange,
          handleSlotClick: canvasPanelState.paletteSlots.handlePaletteClick,
        }}
        palettes={canvasPanelState.paletteSlots.palettes}
        slotColorIndices={
          canvasPanelState.paletteSlots.palettes[
            canvasPanelState.paletteSlots.activePalette
          ] ?? DEFAULT_SLOT_COLORS
        }
        transparentSlotIndices={[0]}
      />

      <SurfaceCard className={styles.surface}>
        <CanvasToolOverlay
          controlsId="sprite-mode-canvas-tool-menu"
          labels={{
            close: "ツールを閉じる",
            open: "ツールを開く",
          }}
          toggleState={{
            isOpen: canvasPanelState.toolOverlay.isToolsOpen,
            onToggle: canvasPanelState.toolOverlay.handleToggleTools,
          }}
          menu={
            <SpriteModeToolMenu
              id="sprite-mode-canvas-tool-menu"
              toolMenu={canvasPanelState.toolOverlay.toolMenu}
            />
          }
        />
        <SpriteModeCanvasSurface
          canvasSurface={canvasPanelState.canvasSurface}
        />
      </SurfaceCard>
    </SurfaceCard>
  );
};
