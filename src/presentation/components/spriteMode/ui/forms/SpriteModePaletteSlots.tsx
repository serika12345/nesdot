import { Badge, Select, Text } from "@radix-ui/themes";
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
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import paletteColors from "../../../common/ui/palette/NesPaletteColors.module.css";
import styles from "./SpriteModePaletteSlots.module.css";

const resolvePaletteColorClassName = (index: number): string =>
  pipe(
    getArrayItem(NES_PALETTE_HEX, index),
    O.map(() => {
      const colorClassName = paletteColors[`c${index}`];

      if (typeof colorClassName !== "string") {
        return typeof paletteColors.c0 === "string" ? paletteColors.c0 : "";
      }

      return colorClassName;
    }),
    O.match(
      () => (typeof paletteColors.c0 === "string" ? paletteColors.c0 : ""),
      (colorClassName) => colorClassName,
    ),
  );

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
  const paletteOptions = palettes.map((_, index) => ({
    label: `パレット ${index}`,
    value: String(index),
  }));
  const activePaletteLabel =
    paletteOptions.find((option) => option.value === String(activePalette))
      ?.label ?? "パレット";

  return (
    <div className={styles.root}>
      <SurfaceCard className={styles.surface}>
        <div className={styles.content}>
          <div className={styles.header}>
            <Text size="2">現在のスロット</Text>
            <Badge color="teal" size="2" variant="surface">
              {`スロット ${activeSlot}`}
            </Badge>
          </div>

          <label className={styles.paletteField}>
            <span className={styles.label}>パレット</span>
            <Select.Root
              value={String(activePalette)}
              onValueChange={handlePaletteChange}
            >
              <Select.Trigger aria-label="パレット" className={styles.select}>
                {activePaletteLabel}
              </Select.Trigger>
              {typeof document !== "undefined" ? (
                <Select.Content>
                  {paletteOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              ) : (
                <></>
              )}
            </Select.Root>
          </label>

          <div className={styles.row}>
            {palettes[activePalette].map((colorIndex, slotIndex) => {
              const buttonClassName =
                activeSlot === slotIndex
                  ? `${styles.slotButton} ${styles.slotButtonActive}`
                  : styles.slotButton;
              const swatchClassName =
                slotIndex === 0
                  ? `${styles.swatch} ${styles.transparentSwatch}`
                  : `${styles.swatch} ${resolvePaletteColorClassName(colorIndex)}`;

              return (
                <button
                  key={slotIndex}
                  type="button"
                  className={buttonClassName}
                  onClick={() => onPaletteClick(slotIndex)}
                  title={
                    slotIndex === 0
                      ? "スロット 0: 透明"
                      : `スロット ${slotIndex}`
                  }
                >
                  <span aria-hidden="true" className={swatchClassName} />
                  <span
                    className={styles.slotLabel}
                  >{`スロット${slotIndex}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
};
