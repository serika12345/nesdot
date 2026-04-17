import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  NES_PALETTE_HEX,
  nesIndexToCssHex,
} from "../../../../../../domain/nes/palette";
import { type PalettePickerState } from "../../../logic/palettePickerState";
import {
  colorSwatchStyle,
  createColorLibraryButtonStyle,
  disclosureChevronStyle,
  pickerPanelPaperStyle,
  transparentSwatchStyle,
} from "./styles";

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
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          パレット {palettePickerState.activePalette} / スロット{" "}
          {palettePickerState.activeSlot}
        </Typography>
        <Box
          title={`#${palettePickerState.activeColorIndex
            .toString(16)
            .padStart(2, "0")
            .toUpperCase()}`}
          style={
            palettePickerState.activeSlot === 0
              ? transparentSwatchStyle
              : colorSwatchStyle(palettePickerState.activeColorHex)
          }
        />
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
      </Stack>

      <Collapse in={palettePickerState.isPaletteListOpen}>
        <Stack spacing={1.5}>
          {palettePickerState.palettes.map((palette, paletteIndex) => {
            const isActivePalette =
              palettePickerState.activePalette === paletteIndex;

            return (
              <Paper
                key={paletteIndex}
                variant="outlined"
                style={pickerPanelPaperStyle}
              >
                <Stack spacing={1.25}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">
                      パレット {paletteIndex}
                    </Typography>
                    {isActivePalette ? (
                      <Chip size="small" color="primary" label="選択中" />
                    ) : (
                      <></>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
                          <Box
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
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Collapse>

      <Collapse in={palettePickerState.isLibraryOpen}>
        <Paper variant="outlined" style={pickerPanelPaperStyle}>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
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
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
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
            </Stack>
          </Stack>
        </Paper>
      </Collapse>
    </Stack>
  );
};
