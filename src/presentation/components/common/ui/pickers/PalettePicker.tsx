import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  NES_PALETTE_HEX,
  nesIndexToCssHex,
} from "../../../../../domain/nes/palette";
import { type PalettePickerState } from "../../logic/palettePickerState";
import {
  colorSwatchStyle,
  createColorLibraryButtonStyle,
  disclosureChevronStyle,
  pickerPanelPaperStyle,
  transparentSwatchStyle,
} from "./PalettePickerStyle";
import styles from "./PalettePicker.module.css";

interface PalettePickerProps {
  palettePickerState: PalettePickerState;
}

/**
 * NES パレットの選択と色差し替えを行う共通パレットエディタです。
 * 表示状態と action は外から受け取り、component 自体は描画だけを担当します。
 */
export const PalettePicker: React.FC<PalettePickerProps> = ({
  palettePickerState,
}) => {
  return (
    <div className={styles.root}>
      <div className={styles.currentRow}>
        <Typography variant="h6">
          パレット {palettePickerState.activePalette} / スロット{" "}
          {palettePickerState.activeSlot}
        </Typography>
        <span
          title={`#${palettePickerState.activeColorIndex
            .toString(16)
            .padStart(2, "0")
            .toUpperCase()}`}
          className={styles.swatch}
          style={
            palettePickerState.activeSlot === 0
              ? transparentSwatchStyle
              : colorSwatchStyle(palettePickerState.activeColorHex)
          }
        />
      </div>

      <div className={styles.actionRow}>
        <Button
          type="button"
          variant={
            palettePickerState.isPaletteListOpen ? "contained" : "outlined"
          }
          endIcon={
            <ExpandMoreRoundedIcon
              style={disclosureChevronStyle(
                palettePickerState.isPaletteListOpen,
              )}
            />
          }
          onClick={palettePickerState.handlePaletteListToggle}
        >
          {palettePickerState.isPaletteListOpen
            ? "パレットを閉じる"
            : "パレットを開く"}
        </Button>
        <Button
          type="button"
          variant={palettePickerState.isLibraryOpen ? "contained" : "outlined"}
          endIcon={
            <ExpandMoreRoundedIcon
              style={disclosureChevronStyle(palettePickerState.isLibraryOpen)}
            />
          }
          onClick={palettePickerState.handleLibraryToggle}
        >
          {palettePickerState.isLibraryOpen
            ? "色ライブラリを閉じる"
            : "色ライブラリを開く"}
        </Button>
      </div>

      <Collapse in={palettePickerState.isPaletteListOpen}>
        <div className={styles.paletteList}>
          {palettePickerState.palettes.map((palette, paletteIndex) => {
            const isActivePalette =
              palettePickerState.activePalette === paletteIndex;

            return (
              <Paper
                key={paletteIndex}
                variant="outlined"
                style={pickerPanelPaperStyle}
              >
                <div className={styles.paletteCard}>
                  <div className={styles.paletteCardHeader}>
                    <Typography variant="subtitle2">
                      パレット {paletteIndex}
                    </Typography>
                    {isActivePalette ? (
                      <Chip size="small" color="primary" label="選択中" />
                    ) : (
                      <></>
                    )}
                  </div>

                  <div className={styles.slotRow}>
                    {palette.map((colorIndex, slotIndex) => (
                      <Button
                        key={slotIndex}
                        type="button"
                        aria-label={`背景パレット ${paletteIndex} スロット ${slotIndex}`}
                        variant={
                          isActivePalette &&
                          palettePickerState.activeSlot === slotIndex
                            ? "contained"
                            : "outlined"
                        }
                        disabled={slotIndex === 0}
                        onClick={() =>
                          palettePickerState.handlePaletteSlotSelect(
                            paletteIndex,
                            slotIndex,
                          )
                        }
                        title={
                          slotIndex === 0
                            ? "スロット 0: 透明"
                            : `スロット ${slotIndex}`
                        }
                        startIcon={
                          <span
                            aria-hidden="true"
                            className={styles.swatch}
                            style={
                              slotIndex === 0
                                ? transparentSwatchStyle
                                : colorSwatchStyle(nesIndexToCssHex(colorIndex))
                            }
                          />
                        }
                      >
                        スロット{slotIndex}
                      </Button>
                    ))}
                  </div>
                </div>
              </Paper>
            );
          })}
        </div>
      </Collapse>

      <Collapse in={palettePickerState.isLibraryOpen}>
        <Paper variant="outlined" style={pickerPanelPaperStyle}>
          <div className={styles.libraryCard}>
            <div className={styles.libraryHeader}>
              <Typography variant="body2">
                パレット {palettePickerState.activePalette} / スロット{" "}
                {palettePickerState.activeSlot} に割り当てる色を選択
              </Typography>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`#${palettePickerState.activeColorIndex
                  .toString(16)
                  .padStart(2, "0")
                  .toUpperCase()}`}
              />
            </div>
            <div className={styles.colorRow}>
              {NES_PALETTE_HEX.map((hex, colorIndex) => (
                <Button
                  key={colorIndex}
                  type="button"
                  aria-label={`NES色 #${colorIndex
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase()}`}
                  title={`#${colorIndex
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase()}`}
                  onClick={() =>
                    palettePickerState.handleColorSelect(colorIndex)
                  }
                  variant={
                    colorIndex === palettePickerState.activeColorIndex
                      ? "contained"
                      : "outlined"
                  }
                  style={createColorLibraryButtonStyle(
                    hex,
                    colorIndex === palettePickerState.activeColorIndex,
                  )}
                />
              ))}
            </div>
          </div>
        </Paper>
      </Collapse>
    </div>
  );
};
