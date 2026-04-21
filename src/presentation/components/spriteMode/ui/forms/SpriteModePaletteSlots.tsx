import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  ColorIndexOfPalette,
  PaletteIndex,
} from "../../../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../../../domain/nes/nesProject";
import { NES_PALETTE_HEX } from "../../../../../domain/nes/palette";
import { getArrayItem } from "../../../../../shared/arrayAccess";
import { slotSwatchStyle } from "./SpriteModePaletteSlotsStyle";
import styles from "./SpriteModePaletteSlots.module.css";

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
    <div className={styles.root}>
      <Paper variant="outlined">
        <div className={styles.content}>
          <div className={styles.header}>
            <Typography variant="body2">現在のスロット</Typography>
            <Chip
              size="small"
              color="primary"
              label={`パレット ${activePalette}`}
            />
          </div>

          <div className={styles.row}>
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
                  <span
                    aria-hidden="true"
                    className={styles.swatch}
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
          </div>
        </div>
      </Paper>
    </div>
  );
};
