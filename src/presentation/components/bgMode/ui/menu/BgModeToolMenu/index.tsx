import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import React from "react";
import { type PaletteIndex } from "../../../../../../application/state/projectStore";
import {
  canvasOverlayMenuProps,
  mockToolbarProps,
} from "../../panels/bgModePanelStyles";

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
    <Stack {...canvasOverlayMenuProps} id="bg-mode-canvas-tool-menu">
      <Stack {...mockToolbarProps}>
        <Button
          type="button"
          color={tool === "pen" ? "primary" : "inherit"}
          variant={tool === "pen" ? "contained" : "outlined"}
          aria-label="ペンツール"
          aria-pressed={tool === "pen"}
          size="small"
          onClick={() => {
            onToolChange("pen");
          }}
        >
          ペン
        </Button>
        <Button
          type="button"
          color={tool === "eraser" ? "primary" : "inherit"}
          variant={tool === "eraser" ? "contained" : "outlined"}
          aria-label="消しゴムツール"
          aria-pressed={tool === "eraser"}
          size="small"
          onClick={() => {
            onToolChange("eraser");
          }}
        >
          消しゴム
        </Button>
      </Stack>

      <Stack {...mockToolbarProps}>
        {BG_PALETTE_OPTIONS.map((paletteIndex) => (
          <Button
            key={`bg-mode-palette-${paletteIndex}`}
            type="button"
            color={activePaletteIndex === paletteIndex ? "primary" : "inherit"}
            variant={
              activePaletteIndex === paletteIndex ? "contained" : "outlined"
            }
            size="small"
            aria-label={`BGパレット ${paletteIndex}`}
            aria-pressed={activePaletteIndex === paletteIndex}
            onClick={() => {
              onActivePaletteChange(paletteIndex);
            }}
          >
            {`Palette ${paletteIndex}`}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
};
