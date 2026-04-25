import React from "react";
import { Button } from "@radix-ui/themes";
import { type PaletteIndex } from "../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { mergeClassNames } from "../../../../styleClassNames";
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
  backgroundPalettes: ReadonlyArray<NesSubPalette>;
  handlePaintPixel: (pixelX: number, pixelY: number) => void;
  selectedTile: BackgroundTile;
  universalBackgroundColor: NesColorIndex;
}

interface BgModeEditorToolMenuState {
  activePaletteIndex: PaletteIndex;
  handlePaletteChange: (paletteIndex: PaletteIndex) => void;
  handleToolChange: (nextTool: BgModeTool) => void;
  tool: BgModeTool;
}

export interface BgModeEditorPanelState {
  canvasState: BgModeEditorCanvasState;
  handleToolMenuToggle: () => void;
  isToolMenuOpen: boolean;
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
      <div
        className={styles.canvasViewport}
        aria-label="BGタイル編集キャンバスビュー"
      >
        <div className={styles.overlayRoot}>
          <Button
            type="button"
            aria-expanded={editorPanelState.isToolMenuOpen}
            aria-controls="bg-mode-canvas-tool-menu"
            aria-label={
              editorPanelState.isToolMenuOpen
                ? "BGツールを閉じる"
                : "BGツールを開く"
            }
            color={editorPanelState.isToolMenuOpen === true ? "teal" : "gray"}
            size="1"
            variant={
              editorPanelState.isToolMenuOpen === true ? "solid" : "outline"
            }
            onClick={editorPanelState.handleToolMenuToggle}
          >
            {editorPanelState.isToolMenuOpen ? "閉じる" : "開く"}
            <ChevronDownIcon
              className={mergeClassNames(
                styles.chevron ?? "",
                editorPanelState.isToolMenuOpen === true
                  ? (styles.chevronOpen ?? "")
                  : false,
              )}
            />
          </Button>

          {editorPanelState.isToolMenuOpen === true ? (
            <BgModeToolMenu
              activePaletteIndex={
                editorPanelState.toolMenuState.activePaletteIndex
              }
              tool={editorPanelState.toolMenuState.tool}
              onActivePaletteChange={
                editorPanelState.toolMenuState.handlePaletteChange
              }
              onToolChange={editorPanelState.toolMenuState.handleToolChange}
            />
          ) : (
            <></>
          )}
        </div>

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
            onPaintPixel={editorPanelState.canvasState.handlePaintPixel}
          />
        </div>
      </div>
    </SurfaceCard>
  );
};
