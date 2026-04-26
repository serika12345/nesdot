import React from "react";
import {
  ColorIndexOfPalette,
  PaletteIndex,
} from "../../../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../../../domain/nes/nesProject";
import { PaletteSlotSelector } from "../../../common/ui/palette/PaletteSlotSelector";

const DEFAULT_SLOT_COLORS: ReadonlyArray<number> = [0, 0, 0, 0];

interface SpriteModePaletteSlotsProps {
  activePalette: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  handlePaletteChange: (index: string) => void;
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
  handlePaletteChange,
  palettes,
  onPaletteClick,
}) => {
  return (
    <PaletteSlotSelector
      paletteState={{
        activePalette,
        activeSlot,
        handlePaletteChange,
        handleSlotClick: onPaletteClick,
      }}
      palettes={palettes}
      slotColorIndices={palettes[activePalette] ?? DEFAULT_SLOT_COLORS}
      transparentSlotIndices={[0]}
    />
  );
};
