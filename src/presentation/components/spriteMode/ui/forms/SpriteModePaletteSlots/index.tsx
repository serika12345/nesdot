import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  ColorIndexOfPalette,
  PaletteIndex,
} from "../../../../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../../../../domain/nes/nesProject";
import { NES_PALETTE_HEX } from "../../../../../../domain/nes/palette";
import { getArrayItem } from "../../../../../../shared/arrayAccess";
import { PanelHeaderRow } from "../../../../../App.styles";
import { paletteSlotsPaperStyle, slotSwatchStyle } from "./styles";

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

/**
 * 選択中パレットの 4 スロットを表示し、描画色を切り替えるパネルです。
 * 現在の色選択を視覚的に確認しながら、編集ツールの入力色を素早く変更できるようにします。
 */
export const SpriteModePaletteSlots: React.FC<SpriteModePaletteSlotsProps> = ({
  activePalette,
  activeSlot,
  palettes,
  onPaletteClick,
}) => {
  return (
    <Paper variant="outlined" style={paletteSlotsPaperStyle}>
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
