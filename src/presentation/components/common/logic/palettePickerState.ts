import { useCallback, useState } from "react";
import {
  type ColorIndexOfPalette,
  useProjectState,
} from "../../../../application/state/projectStore";
import {
  type NesBackgroundPalettes,
  type NesColorIndex,
  type NesPaletteIndex,
  type NesProjectState,
  type NesSubPalette,
} from "../../../../domain/nes/nesProject";
import { nesIndexToCssHex } from "../../../../domain/nes/palette";

const isPaletteIndex = (value: number): value is NesPaletteIndex =>
  value === 0 || value === 1 || value === 2 || value === 3;

const isColorIndexOfPalette = (value: number): value is ColorIndexOfPalette =>
  value === 0 || value === 1 || value === 2 || value === 3;

const clonePalette = (palette: NesSubPalette): NesSubPalette => [
  palette[0],
  palette[1],
  palette[2],
  palette[3],
];

const replacePaletteSlot = (
  palette: NesSubPalette,
  slotIndex: ColorIndexOfPalette,
  nextColorIndex: NesColorIndex,
): NesSubPalette => [
  slotIndex === 0 ? nextColorIndex : palette[0],
  slotIndex === 1 ? nextColorIndex : palette[1],
  slotIndex === 2 ? nextColorIndex : palette[2],
  slotIndex === 3 ? nextColorIndex : palette[3],
];

const replaceSelectedPalette = (
  palettes: NesBackgroundPalettes,
  paletteIndex: NesPaletteIndex,
  slotIndex: ColorIndexOfPalette,
  nextColorIndex: NesColorIndex,
): NesBackgroundPalettes => [
  paletteIndex === 0
    ? replacePaletteSlot(palettes[0], slotIndex, nextColorIndex)
    : clonePalette(palettes[0]),
  paletteIndex === 1
    ? replacePaletteSlot(palettes[1], slotIndex, nextColorIndex)
    : clonePalette(palettes[1]),
  paletteIndex === 2
    ? replacePaletteSlot(palettes[2], slotIndex, nextColorIndex)
    : clonePalette(palettes[2]),
  paletteIndex === 3
    ? replacePaletteSlot(palettes[3], slotIndex, nextColorIndex)
    : clonePalette(palettes[3]),
];

export interface PalettePickerState {
  activeColorHex: string;
  activeColorIndex: NesColorIndex;
  activePalette: NesPaletteIndex;
  activeSlot: ColorIndexOfPalette;
  handleColorSelect: (nextColorIndex: NesColorIndex) => void;
  handlePaletteSlotSelect: (paletteIndex: number, slotIndex: number) => void;
  palettes: NesBackgroundPalettes;
}

/**
 * 共通 palette picker が選択した色を BG/Sprite 両 palette に反映します。
 * 共通 editor から見た配色一貫性を維持するため、両 palette を同じ slot で更新します。
 */
export const applyPalettePickerColorSelection = (
  nes: NesProjectState,
  activePalette: NesPaletteIndex,
  activeSlot: ColorIndexOfPalette,
  nextColorIndex: NesColorIndex,
): NesProjectState => ({
  ...nes,
  backgroundPalettes: replaceSelectedPalette(
    nes.backgroundPalettes,
    activePalette,
    activeSlot,
    nextColorIndex,
  ),
  spritePalettes: replaceSelectedPalette(
    nes.spritePalettes,
    activePalette,
    activeSlot,
    nextColorIndex,
  ),
});

/**
 * `PalettePicker` 用の表示 state と project 更新 action をまとめます。
 * component は描画だけに保ち、palette 同期の責務はこの hook に閉じ込めます。
 */
export const usePalettePickerState = (): PalettePickerState => {
  const palettes = useProjectState((state) => state.nes.backgroundPalettes);
  const [activePalette, setActivePalette] = useState<NesPaletteIndex>(0);
  const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);

  const handlePaletteSlotSelect = useCallback(
    (paletteIndex: number, slotIndex: number): void => {
      if (
        isPaletteIndex(paletteIndex) === false ||
        isColorIndexOfPalette(slotIndex) === false
      ) {
        return;
      }

      setActivePalette(paletteIndex);
      setActiveSlot(slotIndex);
    },
    [],
  );

  const handleColorSelect = useCallback(
    (nextColorIndex: NesColorIndex): void => {
      useProjectState.setState((state) => ({
        nes: applyPalettePickerColorSelection(
          state.nes,
          activePalette,
          activeSlot,
          nextColorIndex,
        ),
      }));
    },
    [activePalette, activeSlot],
  );

  const activeColorIndex = palettes[activePalette][activeSlot];

  return {
    activeColorHex: nesIndexToCssHex(activeColorIndex),
    activeColorIndex,
    activePalette,
    activeSlot,
    handleColorSelect,
    handlePaletteSlotSelect,
    palettes,
  };
};
