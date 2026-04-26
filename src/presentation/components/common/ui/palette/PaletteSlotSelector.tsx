import { Select } from "@radix-ui/themes";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  type ColorIndexOfPalette,
  type PaletteIndex,
} from "../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
import { NES_PALETTE_HEX } from "../../../../../domain/nes/palette";
import { getArrayItem } from "../../../../../shared/arrayAccess";
import { SurfaceCard } from "../chrome/SurfaceCard";
import paletteColors from "./NesPaletteColors.module.css";
import styles from "./PaletteSlotSelector.module.css";

const toColorIndexOfPalette = (index: number): ColorIndexOfPalette | false => {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }

  return false;
};

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

const isTransparentSlot = (
  transparentSlotIndices: ReadonlyArray<ColorIndexOfPalette>,
  slotIndex: ColorIndexOfPalette,
): boolean =>
  transparentSlotIndices.some(
    (transparentSlotIndex) => transparentSlotIndex === slotIndex,
  );

interface PaletteSlotSelectorState {
  activePalette: PaletteIndex;
  activeSlot: ColorIndexOfPalette;
  handlePaletteChange: (index: string) => void;
  handleSlotClick: (slot: ColorIndexOfPalette) => void;
}

interface PaletteSlotSelectorProps {
  paletteState: PaletteSlotSelectorState;
  palettes: ReadonlyArray<NesSubPalette>;
  slotColorIndices: ReadonlyArray<NesColorIndex>;
  transparentSlotIndices?: ReadonlyArray<ColorIndexOfPalette>;
}

/**
 * NES のパレット切り替えと 4 スロット選択をまとめた共通 UI です。
 */
export const PaletteSlotSelector: React.FC<PaletteSlotSelectorProps> = ({
  paletteState,
  palettes,
  slotColorIndices,
  transparentSlotIndices = [],
}) => {
  const paletteOptions = palettes.map((_, index) => ({
    label: `パレット${index}`,
    value: String(index),
  }));
  const activePaletteLabel = `パレット${paletteState.activePalette}`;

  return (
    <div className={styles.root}>
      <SurfaceCard className={styles.surface}>
        <div className={styles.content}>
          <Select.Root
            value={String(paletteState.activePalette)}
            onValueChange={paletteState.handlePaletteChange}
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

          <div className={styles.row}>
            {slotColorIndices.map((colorIndex, slotIndex) => {
              const colorSlot = toColorIndexOfPalette(slotIndex);

              if (colorSlot === false) {
                return <></>;
              }

              const transparent = isTransparentSlot(
                transparentSlotIndices,
                colorSlot,
              );
              const buttonClassName =
                paletteState.activeSlot === colorSlot
                  ? `${styles.slotButton} ${styles.slotButtonActive}`
                  : styles.slotButton;
              const swatchClassName = transparent
                ? `${styles.swatch} ${styles.transparentSwatch}`
                : `${styles.swatch} ${resolvePaletteColorClassName(colorIndex)}`;

              return (
                <button
                  key={colorSlot}
                  type="button"
                  className={buttonClassName}
                  onClick={() => paletteState.handleSlotClick(colorSlot)}
                  title={
                    transparent
                      ? `スロット ${colorSlot}: 透明`
                      : `スロット ${colorSlot}`
                  }
                >
                  <span aria-hidden="true" className={swatchClassName} />
                  <span
                    className={styles.slotLabel}
                  >{`スロット${colorSlot}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
};
