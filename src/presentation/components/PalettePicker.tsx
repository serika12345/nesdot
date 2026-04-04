import * as O from "fp-ts/Option";
import React, { useState } from "react";
import { NES_PALETTE_HEX, nesIndexToCssHex } from "../../domain/nes/palette";
import {
  NesBackgroundPalettes,
  NesColorIndex,
  NesPaletteIndex,
  NesSubPalette,
} from "../../domain/nes/nesProject";
import { ColorIndexOfPalette, useProjectState } from "../../application/state/projectStore";
import {
  ColorCell,
  DisclosureButton,
  DisclosureRow,
  Grid,
  LibraryCaption,
  LibraryHeader,
  Note,
  PaletteCard,
  PaletteHeader,
  PaletteList,
  PaletteName,
  PaletteStatus,
  Root,
  ScrollWrap,
  SelectionDetails,
  SelectionSummary,
  SelectionSwatch,
  SelectionValue,
  SlotButton,
  SlotGroup,
  SlotLabel,
  SlotRow,
} from "./PalettePicker.styles";
import { ChevronIcon } from "./ui/Icons";

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
    <Root>
      <SelectionSummary>
        <SelectionDetails>
          <SelectionValue>
            パレット {activePalette} / スロット {activeSlot}
          </SelectionValue>
        </SelectionDetails>
        <SelectionSwatch
          transparent={activeSlot === 0}
          {...(activeSlot !== 0 ? { bg: activeColorHex } : {})}
          title={`#${activeColorIndex.toString(16).padStart(2, "0").toUpperCase()}`}
        />
      </SelectionSummary>

      <DisclosureRow>
        <DisclosureButton
          type="button"
          open={isPaletteListOpen}
          onClick={() => setIsPaletteListOpen((prev) => !prev)}
          endIcon={<ChevronIcon open={isPaletteListOpen} />}
        >
          {isPaletteListOpen ? "パレットを閉じる" : "パレットを開く"}
        </DisclosureButton>
        <DisclosureButton
          type="button"
          open={isLibraryOpen}
          onClick={() => setIsLibraryOpen((prev) => !prev)}
          endIcon={<ChevronIcon open={isLibraryOpen} />}
        >
          {isLibraryOpen ? "色ライブラリを閉じる" : "色ライブラリを開く"}
        </DisclosureButton>
      </DisclosureRow>

      {isPaletteListOpen && (
        <PaletteList>
          {palettes.map((palette, i) => {
            const isActivePalette = activePalette === i;

            return (
              <PaletteCard key={i} active={isActivePalette}>
                <PaletteHeader>
                  <PaletteName>パレット {i}</PaletteName>
                </PaletteHeader>

                <SlotRow>
                  {palette.map((idx, j) => (
                    <SlotGroup
                      key={j}
                      active={isActivePalette && activeSlot === j}
                    >
                      <SlotButton
                        {...(j !== 0
                          ? { onClick: () => handlePaletteClick(i, j) }
                          : {})}
                        title={j === 0 ? "スロット 0: 透明" : `スロット ${j}`}
                        active={activeSlot === j && isActivePalette}
                        transparent={j === 0}
                        {...(j !== 0 ? { bg: nesIndexToCssHex(idx) } : {})}
                      />
                      <SlotLabel>スロット{j}</SlotLabel>
                    </SlotGroup>
                  ))}
                </SlotRow>
              </PaletteCard>
            );
          })}
        </PaletteList>
      )}

      {isLibraryOpen && (
        <ScrollWrap>
          <LibraryHeader>
            <LibraryCaption>
              パレット {activePalette} / スロット {activeSlot}{" "}
              に割り当てる色を選択
            </LibraryCaption>
            <PaletteStatus active>
              #{activeColorIndex.toString(16).padStart(2, "0").toUpperCase()}
            </PaletteStatus>
          </LibraryHeader>
          <Grid>
            {NES_PALETTE_HEX.map((hex, idx) => (
              <ColorCell
                key={idx}
                onClick={() => setSlot(activeSlot, idx)}
                title={`#${idx.toString(16).padStart(2, "0").toUpperCase()}`}
                bg={hex}
                active={idx === activeColorIndex}
              />
            ))}
          </Grid>
        </ScrollWrap>
      )}

      <Note>
        注意:
        スロット0は「透明扱い」です。実際の色は描画しません（チェッカ柄表示）。
      </Note>
    </Root>
  );
};
