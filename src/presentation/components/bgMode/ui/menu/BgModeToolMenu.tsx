import React from "react";
import { Button } from "@radix-ui/themes";
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
        <Button
          aria-label="ペンツール"
          aria-pressed={tool === "pen"}
          color={tool === "pen" ? "teal" : "gray"}
          size="1"
          variant={tool === "pen" ? "solid" : "outline"}
          onClick={() => {
            onToolChange("pen");
          }}
        >
          ペン
        </Button>
        <Button
          aria-label="消しゴムツール"
          aria-pressed={tool === "eraser"}
          color={tool === "eraser" ? "teal" : "gray"}
          size="1"
          variant={tool === "eraser" ? "solid" : "outline"}
          onClick={() => {
            onToolChange("eraser");
          }}
        >
          消しゴム
        </Button>
      </div>

      <div className={styles.toolbar}>
        {BG_PALETTE_OPTIONS.map((paletteIndex) => (
          <Button
            key={`bg-mode-palette-${paletteIndex}`}
            aria-label={`BGパレット ${paletteIndex}`}
            aria-pressed={activePaletteIndex === paletteIndex}
            color={activePaletteIndex === paletteIndex ? "teal" : "gray"}
            size="1"
            variant={activePaletteIndex === paletteIndex ? "solid" : "outline"}
            onClick={() => {
              onActivePaletteChange(paletteIndex);
            }}
          >
            {`Palette ${paletteIndex}`}
          </Button>
        ))}
      </div>
    </div>
  );
};
