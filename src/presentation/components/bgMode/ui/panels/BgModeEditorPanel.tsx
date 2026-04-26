import React from "react";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
} from "../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { resolveBgModePaintColorIndex } from "../../logic/bgModeWorkspaceEditingState";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { CanvasToolOverlay } from "../../../common/ui/overlay/CanvasToolOverlay";
import { PaletteSlotSelector } from "../../../common/ui/palette/PaletteSlotSelector";
import { BgModeTileEditorCanvas } from "../canvas/BgModeTileEditorCanvas";
import { BgModeToolMenu } from "../menu/BgModeToolMenu";
import styles from "./BgModePanels.module.css";

type BgModeTool = "pen" | "eraser";

const DEFAULT_BG_PALETTE: NesSubPalette = [0, 0, 0, 0];

const resolveActivePalette = (
  backgroundPalettes: ReadonlyArray<NesSubPalette>,
  activePaletteIndex: PaletteIndex,
): NesSubPalette =>
  backgroundPalettes[activePaletteIndex] ?? DEFAULT_BG_PALETTE;

interface BgModeEditorCanvasState {
  activePaletteIndex: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  backgroundPalettes: ReadonlyArray<NesSubPalette>;
  handleFlushPaint: () => void;
  handlePaintPixel: (pixelX: number, pixelY: number) => void;
  selectedTile: BackgroundTile;
  slotColorIndices: ReadonlyArray<NesColorIndex>;
  universalBackgroundColor: NesColorIndex;
}

interface BgModeEditorPaletteState {
  activePaletteIndex: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  backgroundPalettes: ReadonlyArray<NesSubPalette>;
  handlePaletteChange: (value: string) => void;
  handleSlotClick: (slot: ColorIndexOfPalette) => void;
  slotColorIndices: ReadonlyArray<NesColorIndex>;
}

interface BgModeEditorToolMenuState {
  handleToolChange: (nextTool: BgModeTool) => void;
  tool: BgModeTool;
}

export interface BgModeEditorPanelState {
  canvasState: BgModeEditorCanvasState;
  handleToolMenuToggle: () => void;
  isToolMenuOpen: boolean;
  paletteState: BgModeEditorPaletteState;
  toolMenuState: BgModeEditorToolMenuState;
}

interface BgModeEditorPanelProps {
  editorPanelState: BgModeEditorPanelState;
}

/**
 * BG タイル editor panel です。
 * キャンバスとツールオーバーレイの表示だけを担当します。
 */
export const BgModeEditorPanel: React.FC<BgModeEditorPanelProps> = ({
  editorPanelState,
}) => {
  return (
    <SurfaceCard
      className={`${styles.panel} ${styles.editorPanel}`}
      aria-label="BGタイルエディター"
    >
      <PaletteSlotSelector
        paletteState={{
          activePalette: editorPanelState.paletteState.activePaletteIndex,
          activeSlot: editorPanelState.paletteState.activeSlot,
          handlePaletteChange:
            editorPanelState.paletteState.handlePaletteChange,
          handleSlotClick: editorPanelState.paletteState.handleSlotClick,
        }}
        palettes={editorPanelState.paletteState.backgroundPalettes}
        slotColorIndices={editorPanelState.paletteState.slotColorIndices}
      />

      <SurfaceCard className={styles.canvasSurface}>
        <CanvasToolOverlay
          controlsId="bg-mode-canvas-tool-menu"
          labels={{
            close: "ツールを閉じる",
            open: "ツールを開く",
          }}
          toggleState={{
            isOpen: editorPanelState.isToolMenuOpen,
            onToggle: editorPanelState.handleToolMenuToggle,
          }}
          menu={
            <BgModeToolMenu
              id="bg-mode-canvas-tool-menu"
              tool={editorPanelState.toolMenuState.tool}
              onToolChange={editorPanelState.toolMenuState.handleToolChange}
            />
          }
        />

        <div
          className={styles.canvasViewport}
          aria-label="BGタイル編集キャンバスビュー"
        >
          <div className={styles.canvasWrap}>
            <BgModeTileEditorCanvas
              tile={editorPanelState.canvasState.selectedTile}
              palette={resolveActivePalette(
                editorPanelState.canvasState.backgroundPalettes,
                editorPanelState.canvasState.activePaletteIndex,
              )}
              universalBackgroundColor={
                editorPanelState.canvasState.universalBackgroundColor
              }
              canvasActions={{
                onFlushPaint: editorPanelState.canvasState.handleFlushPaint,
                onPaintPixel: editorPanelState.canvasState.handlePaintPixel,
              }}
              paintColorIndex={resolveBgModePaintColorIndex(
                editorPanelState.toolMenuState.tool,
                editorPanelState.canvasState.activeSlot,
              )}
            />
          </div>
        </div>
      </SurfaceCard>
    </SurfaceCard>
  );
};
