import React from "react";
import { AppButton } from "../../../common/ui/forms/AppControls";
import { type PaletteIndex } from "../../../../../application/state/projectStore";
import styles from "../panels/BgModePanels.module.css";

type BgModeTool = "pen" | "eraser";

interface BgModeToolMenuProps {
  activePaletteIndex: PaletteIndex;
  tool: BgModeTool;
  onActivePaletteChange: (paletteIndex: PaletteIndex) => void;
  onToolChange: (nextTool: BgModeTool) => void;
}

const BG_PALETTE_OPTIONS: ReadonlyArray<PaletteIndex> = [0, 1, 2, 3];

/**
 * BG editor のツールとパレット切り替えメニューです。
 */
export const BgModeToolMenu: React.FC<BgModeToolMenuProps> = ({
  activePaletteIndex,
  tool,
  onActivePaletteChange,
  onToolChange,
}) => {
  return (
    <div className={styles.overlayMenu} id="bg-mode-canvas-tool-menu">
      <div className={styles.toolbar}>
        <AppButton
          aria-label="ペンツール"
          aria-pressed={tool === "pen"}
          size="small"
          tone={tool === "pen" ? "accent" : "neutral"}
          variant={tool === "pen" ? "solid" : "outline"}
          onClick={() => {
            onToolChange("pen");
          }}
        >
          ペン
        </AppButton>
        <AppButton
          aria-label="消しゴムツール"
          aria-pressed={tool === "eraser"}
          size="small"
          tone={tool === "eraser" ? "accent" : "neutral"}
          variant={tool === "eraser" ? "solid" : "outline"}
          onClick={() => {
            onToolChange("eraser");
          }}
        >
          消しゴム
        </AppButton>
      </div>

      <div className={styles.toolbar}>
        {BG_PALETTE_OPTIONS.map((paletteIndex) => (
          <AppButton
            key={`bg-mode-palette-${paletteIndex}`}
            size="small"
            aria-label={`BGパレット ${paletteIndex}`}
            aria-pressed={activePaletteIndex === paletteIndex}
            tone={activePaletteIndex === paletteIndex ? "accent" : "neutral"}
            variant={activePaletteIndex === paletteIndex ? "solid" : "outline"}
            onClick={() => {
              onActivePaletteChange(paletteIndex);
            }}
          >
            {`Palette ${paletteIndex}`}
          </AppButton>
        ))}
      </div>
    </div>
  );
};
