import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as O from "fp-ts/Option";
import React, { useState } from "react";
import {
  ColorIndexOfPalette,
  useProjectState,
} from "../../../../../../application/state/projectStore";
import {
  NesBackgroundPalettes,
  NesColorIndex,
  NesPaletteIndex,
  NesSubPalette,
} from "../../../../../../domain/nes/nesProject";
import {
  NES_PALETTE_HEX,
  nesIndexToCssHex,
} from "../../../../../../domain/nes/palette";
import {
  colorSwatchStyle,
  createColorLibraryButtonStyle,
  disclosureChevronStyle,
  pickerPanelPaperStyle,
  transparentSwatchStyle,
} from "./styles";

/**
 * NES パレットの選択と色差し替えを行う共通パレットエディタです。
 * 背景とスプライトの両方で使う配色を一か所から編集できるようにする意図があります。
 */
export const PalettePicker: React.FC = () => {
  const palettes = useProjectState((s) => s.nes.backgroundPalettes);
  const [activePalette, setActivePalette] = useState<NesPaletteIndex>(0);
  const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1); // 0は透明スロット扱い
  const [isPaletteListOpen, setIsPaletteListOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const toIndex4 = (value: number): O.Option<ColorIndexOfPalette> => {
    if (value === 0 || value === 1 || value === 2 || value === 3) {
      return O.some(value);
    }
    return O.none;
  };

  const handlePaletteClick = (nextPalette: number, nextSlot: number) => {
    const paletteIndexOption = toIndex4(nextPalette);
    const slotIndexOption = toIndex4(nextSlot);
    if (O.isNone(paletteIndexOption) || O.isNone(slotIndexOption)) {
      return;
    }

    setActivePalette(paletteIndexOption.value);
    setActiveSlot(slotIndexOption.value);
    setIsLibraryOpen(true);
  };

  const clonePalette = (palette: NesSubPalette): NesSubPalette => {
    return [palette[0], palette[1], palette[2], palette[3]];
  };

  const setSlot = (slotIndex: ColorIndexOfPalette, idx: NesColorIndex) => {
    const updateSubPalette = (
      palette: NesSubPalette,
      paletteIndex: number,
    ): NesSubPalette => {
      if (paletteIndex !== activePalette) {
        return palette;
      }
      return [
        slotIndex === 0 ? idx : palette[0],
        slotIndex === 1 ? idx : palette[1],
        slotIndex === 2 ? idx : palette[2],
        slotIndex === 3 ? idx : palette[3],
      ];
    };

    const base: NesBackgroundPalettes = [
      clonePalette(palettes[0]),
      clonePalette(palettes[1]),
      clonePalette(palettes[2]),
      clonePalette(palettes[3]),
    ];
    const next: NesBackgroundPalettes = [
      updateSubPalette(base[0], 0),
      updateSubPalette(base[1], 1),
      updateSubPalette(base[2], 2),
      updateSubPalette(base[3], 3),
    ];
    const state = useProjectState.getState();
    useProjectState.setState({
      nes: {
        ...state.nes,
        backgroundPalettes: [
          [next[0][0], next[0][1], next[0][2], next[0][3]],
          [next[1][0], next[1][1], next[1][2], next[1][3]],
          [next[2][0], next[2][1], next[2][2], next[2][3]],
          [next[3][0], next[3][1], next[3][2], next[3][3]],
        ],
        spritePalettes: [
          [next[0][0], next[0][1], next[0][2], next[0][3]],
          [next[1][0], next[1][1], next[1][2], next[1][3]],
          [next[2][0], next[2][1], next[2][2], next[2][3]],
          [next[3][0], next[3][1], next[3][2], next[3][3]],
        ],
      },
    });
  };

  const activeColorIndex = palettes[activePalette][activeSlot];
  const activeColorHex = nesIndexToCssHex(activeColorIndex);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          パレット {activePalette} / スロット {activeSlot}
        </Typography>
        <Box
          title={`#${activeColorIndex.toString(16).padStart(2, "0").toUpperCase()}`}
          style={
            activeSlot === 0
              ? transparentSwatchStyle
              : colorSwatchStyle(activeColorHex)
          }
        />
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          type="button"
          variant={isPaletteListOpen ? "contained" : "outlined"}
          endIcon={
            <ExpandMoreRoundedIcon
              style={disclosureChevronStyle(isPaletteListOpen)}
            />
          }
          onClick={() => setIsPaletteListOpen((prev) => !prev)}
        >
          {isPaletteListOpen ? "パレットを閉じる" : "パレットを開く"}
        </Button>
        <Button
          type="button"
          variant={isLibraryOpen ? "contained" : "outlined"}
          endIcon={
            <ExpandMoreRoundedIcon
              style={disclosureChevronStyle(isLibraryOpen)}
            />
          }
          onClick={() => setIsLibraryOpen((prev) => !prev)}
        >
          {isLibraryOpen ? "色ライブラリを閉じる" : "色ライブラリを開く"}
        </Button>
      </Stack>

      <Collapse in={isPaletteListOpen}>
        <Stack spacing={1.5}>
          {palettes.map((palette, i) => {
            const isActivePalette = activePalette === i;

            return (
              <Paper key={i} variant="outlined" style={pickerPanelPaperStyle}>
                <Stack spacing={1.25}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">パレット {i}</Typography>
                    {isActivePalette ? (
                      <Chip size="small" color="primary" label="選択中" />
                    ) : (
                      <></>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {palette.map((idx, j) => (
                      <Button
                        key={j}
                        type="button"
                        aria-label={`背景パレット ${i} スロット ${j}`}
                        variant={
                          isActivePalette && activeSlot === j
                            ? "contained"
                            : "outlined"
                        }
                        disabled={j === 0}
                        onClick={() => handlePaletteClick(i, j)}
                        title={j === 0 ? "スロット 0: 透明" : `スロット ${j}`}
                        startIcon={
                          <Box
                            style={
                              j === 0
                                ? transparentSwatchStyle
                                : colorSwatchStyle(nesIndexToCssHex(idx))
                            }
                          />
                        }
                      >
                        スロット{j}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Collapse>

      <Collapse in={isLibraryOpen}>
        <Paper variant="outlined" style={pickerPanelPaperStyle}>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
              <Typography variant="body2">
                パレット {activePalette} / スロット {activeSlot}{" "}
                に割り当てる色を選択
              </Typography>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`#${activeColorIndex
                  .toString(16)
                  .padStart(2, "0")
                  .toUpperCase()}`}
              />
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {NES_PALETTE_HEX.map((hex, idx) => (
                <Button
                  key={idx}
                  type="button"
                  aria-label={`NES色 #${idx
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase()}`}
                  title={`#${idx.toString(16).padStart(2, "0").toUpperCase()}`}
                  onClick={() => setSlot(activeSlot, idx)}
                  variant={idx === activeColorIndex ? "contained" : "outlined"}
                  style={createColorLibraryButtonStyle(
                    hex,
                    idx === activeColorIndex,
                  )}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      <Typography variant="caption" color="text.secondary">
        注意:
        スロット0は「透明扱い」です。実際の色は描画しません（チェッカ柄表示）。
      </Typography>
    </Stack>
  );
};
