import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import { type SpriteModeCanvasPanelState } from "../../../logic/spriteModeCanvasState";
import { SpriteModeCanvasSurface } from "../../canvas/SpriteModeCanvasSurface";
import { SpriteModePaletteSlots } from "../../forms/SpriteModePaletteSlots";
import { SpriteModeToolOverlay } from "../../overlay/SpriteModeToolOverlay";

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
    <Stack
      component={Paper}
      variant="outlined"
      spacing="0.875rem"
      p="1.125rem"
      role="region"
      aria-label="スプライトキャンバスパネル"
      flex={1}
      minHeight={0}
    >
      <SpriteModePaletteSlots
        activePalette={canvasPanelState.paletteSlots.activePalette}
        activeSlot={canvasPanelState.paletteSlots.activeSlot}
        palettes={canvasPanelState.paletteSlots.palettes}
        onPaletteClick={canvasPanelState.paletteSlots.handlePaletteClick}
      />

      <Box
        component={Paper}
        variant="outlined"
        flex={1}
        minHeight={0}
        overflow="auto"
        position="relative"
        p="1.125rem"
      >
        <SpriteModeToolOverlay toolOverlay={canvasPanelState.toolOverlay} />
        <SpriteModeCanvasSurface
          canvasSurface={canvasPanelState.canvasSurface}
        />
      </Box>
    </Stack>
  );
};
