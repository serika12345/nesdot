import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  ColorIndexOfPalette,
  PaletteIndex,
} from "../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../domain/nes/nesProject";
import { NES_PALETTE_HEX } from "../../../domain/nes/palette";
import { getArrayItem } from "../../../shared/arrayAccess";
import { PanelHeaderRow } from "../../App.styles";

const slotSwatchStyle = (
  transparent: boolean,
  colorHex: string,
): React.CSSProperties => {
  if (transparent === true) {
    return {
      width: "1.5rem",
      height: "1.5rem",
      borderRadius: "0.5rem",
      border: "1px solid rgba(148, 163, 184, 0.4)",
      backgroundImage:
        "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
      backgroundSize: "0.5rem 0.5rem",
    };
  }

  return {
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    backgroundColor: colorHex,
  };
};

const resolvePaletteHex = (index: number): string =>
  pipe(
    getArrayItem(NES_PALETTE_HEX, index),
    O.getOrElse(() => "#000000"),
  );

interface SpriteModePaletteSlotsProps {
  activePalette: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  palettes: NesSpritePalettes;
  onPaletteClick: (slot: number) => void;
}

export const SpriteModePaletteSlots: React.FC<SpriteModePaletteSlotsProps> = ({
  activePalette,
  activeSlot,
  palettes,
  onPaletteClick,
}) => {
  return (
    <Paper variant="outlined" style={{ padding: "0.875rem", flexShrink: 0 }}>
      <Stack spacing={1}>
        <PanelHeaderRow>
          <Typography variant="body2">現在のスロット</Typography>
          <Chip
            size="small"
            color="primary"
            label={`パレット ${activePalette}`}
          />
        </PanelHeaderRow>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {palettes[activePalette].map((colorIndex, slotIndex) => (
            <Button
              key={slotIndex}
              type="button"
              variant={activeSlot === slotIndex ? "contained" : "outlined"}
              onClick={() => onPaletteClick(slotIndex)}
              title={
                slotIndex === 0 ? "スロット 0: 透明" : `スロット ${slotIndex}`
              }
              startIcon={
                <Box
                  style={slotSwatchStyle(
                    slotIndex === 0,
                    resolvePaletteHex(colorIndex),
                  )}
                />
              }
            >
              スロット{slotIndex}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
