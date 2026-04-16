import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import { SpriteModeCanvasSurface } from "../../canvas/SpriteModeCanvasSurface";
import { useSpriteModePaletteSlots } from "../../core/SpriteModeStateProvider";
import { SpriteModePaletteSlots } from "../../forms/SpriteModePaletteSlots";
import { SpriteModeToolOverlay } from "../../overlay/SpriteModeToolOverlay";

/**
 * スプライト編集の右ペインです。
 * 色スロット、ツール、canvas を 1 つの編集面としてまとめます。
 */
export const SpriteModeCanvasPanel: React.FC = () => {
  const paletteSlots = useSpriteModePaletteSlots();

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
        activePalette={paletteSlots.activePalette}
        activeSlot={paletteSlots.activeSlot}
        palettes={paletteSlots.palettes}
        onPaletteClick={paletteSlots.handlePaletteClick}
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
        <SpriteModeToolOverlay />
        <SpriteModeCanvasSurface />
      </Box>
    </Stack>
  );
};
