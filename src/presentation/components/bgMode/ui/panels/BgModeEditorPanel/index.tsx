import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import { type PaletteIndex } from "../../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../../domain/project/projectV2";
import { BgModeTileEditorCanvas } from "../../canvas/BgModeTileEditorCanvas";
import { BgModeToolMenu } from "../../menu/BgModeToolMenu";
import {
  canvasOverlayRootProps,
  centeredCanvasWrapProps,
  chevronStyle,
  overlayToggleButtonStyle,
} from "../bgModePanelStyles";

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
    <Stack
      component={Paper}
      variant="outlined"
      spacing="0.875rem"
      p="1.125rem"
      aria-label="BGタイルエディター"
      flex={1}
      minHeight={0}
    >
      <Box
        component={Paper}
        variant="outlined"
        flex={1}
        minHeight={0}
        overflow="auto"
        position="relative"
        p="1.125rem"
        aria-label="BGタイル編集キャンバスビュー"
      >
        <Box {...canvasOverlayRootProps}>
          <Button
            type="button"
            aria-expanded={editorPanelState.isToolMenuOpen}
            aria-controls="bg-mode-canvas-tool-menu"
            aria-label={
              editorPanelState.isToolMenuOpen
                ? "BGツールを閉じる"
                : "BGツールを開く"
            }
            color={
              editorPanelState.isToolMenuOpen === true ? "primary" : "inherit"
            }
            endIcon={
              <ExpandMoreRoundedIcon
                style={chevronStyle(editorPanelState.isToolMenuOpen)}
              />
            }
            size="small"
            style={overlayToggleButtonStyle}
            variant={
              editorPanelState.isToolMenuOpen === true
                ? "contained"
                : "outlined"
            }
            onClick={editorPanelState.handleToolMenuToggle}
          >
            {editorPanelState.isToolMenuOpen ? "閉じる" : "開く"}
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
        </Box>

        <Grid {...centeredCanvasWrapProps}>
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
        </Grid>
      </Box>
    </Stack>
  );
};
