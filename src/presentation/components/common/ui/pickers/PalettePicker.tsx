import { Badge, Button, Heading, Text } from "@radix-ui/themes";
import React from "react";
import { SurfaceCard } from "../chrome/SurfaceCard";
import { ChevronDownIcon } from "../icons/AppIcons";
import paletteColors from "../palette/NesPaletteColors.module.css";
import { mergeClassNames } from "../../../../styleClassNames";
import { NES_PALETTE_HEX } from "../../../../../domain/nes/palette";
import { type PalettePickerState } from "../../logic/palettePickerState";
import styles from "./PalettePicker.module.css";

interface PalettePickerProps {
  palettePickerState: PalettePickerState;
}

const resolvePaletteColorClassName = (colorIndex: number): string => {
  const fallbackClassName =
    typeof paletteColors.c0 === "string" ? paletteColors.c0 : "";

  if (colorIndex < 0 || colorIndex >= NES_PALETTE_HEX.length) {
    return fallbackClassName;
  }

  const colorClassName = paletteColors[`c${colorIndex}`];

  if (typeof colorClassName !== "string") {
    return fallbackClassName;
  }

  return colorClassName;
};

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
        <Heading as="h3" size="4">
          パレット {palettePickerState.activePalette} / スロット{" "}
          {palettePickerState.activeSlot}
        </Heading>
        <span
          title={`#${palettePickerState.activeColorIndex
            .toString(16)
            .padStart(2, "0")
            .toUpperCase()}`}
          className={
            palettePickerState.activeSlot === 0
              ? `${styles.swatch} ${styles.transparentSwatch}`
              : `${styles.swatch} ${resolvePaletteColorClassName(
                  palettePickerState.activeColorIndex,
                )}`
          }
        />
      </div>

      <div className={styles.actionRow}>
        <Button
          type="button"
          color={
            palettePickerState.isPaletteListOpen === true ? "teal" : "gray"
          }
          variant={
            palettePickerState.isPaletteListOpen === true ? "solid" : "surface"
          }
          onClick={palettePickerState.handlePaletteListToggle}
        >
          {palettePickerState.isPaletteListOpen
            ? "パレットを閉じる"
            : "パレットを開く"}
          <ChevronDownIcon
            className={mergeClassNames(
              styles.chevron ?? "",
              palettePickerState.isPaletteListOpen === true
                ? (styles.chevronOpen ?? "")
                : false,
            )}
          />
        </Button>
        <Button
          type="button"
          color={palettePickerState.isLibraryOpen === true ? "teal" : "gray"}
          variant={
            palettePickerState.isLibraryOpen === true ? "solid" : "surface"
          }
          onClick={palettePickerState.handleLibraryToggle}
        >
          {palettePickerState.isLibraryOpen
            ? "色ライブラリを閉じる"
            : "色ライブラリを開く"}
          <ChevronDownIcon
            className={mergeClassNames(
              styles.chevron ?? "",
              palettePickerState.isLibraryOpen === true
                ? (styles.chevronOpen ?? "")
                : false,
            )}
          />
        </Button>
      </div>

      {palettePickerState.isPaletteListOpen === true ? (
        <div className={styles.paletteList}>
          {palettePickerState.palettes.map((palette, paletteIndex) => {
            const isActivePalette =
              palettePickerState.activePalette === paletteIndex;

            return (
              <SurfaceCard key={paletteIndex} className={styles.sectionCard}>
                <div className={styles.paletteCard}>
                  <div className={styles.paletteCardHeader}>
                    <Text size="2" weight="medium">
                      パレット {paletteIndex}
                    </Text>
                    {isActivePalette ? (
                      <Badge color="teal" size="2" variant="surface">
                        選択中
                      </Badge>
                    ) : (
                      <></>
                    )}
                  </div>

                  <div className={styles.slotRow}>
                    {palette.map((colorIndex, slotIndex) => {
                      const isActiveSlot =
                        isActivePalette === true &&
                        palettePickerState.activeSlot === slotIndex;
                      const buttonClassName = (() => {
                        if (slotIndex === 0) {
                          return `${styles.slotButton} ${styles.slotButtonDisabled}`;
                        }

                        if (isActiveSlot === true) {
                          return `${styles.slotButton} ${styles.slotButtonActive}`;
                        }

                        return styles.slotButton;
                      })();
                      const swatchClassName =
                        slotIndex === 0
                          ? `${styles.swatch} ${styles.transparentSwatch}`
                          : `${styles.swatch} ${resolvePaletteColorClassName(
                              colorIndex,
                            )}`;

                      return (
                        <button
                          key={slotIndex}
                          type="button"
                          aria-label={`背景パレット ${paletteIndex} スロット ${slotIndex}`}
                          className={buttonClassName}
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
                        >
                          <span
                            aria-hidden="true"
                            className={swatchClassName}
                          />
                          <span className={styles.slotButtonText}>
                            スロット{slotIndex}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      ) : (
        <></>
      )}

      {palettePickerState.isLibraryOpen === true ? (
        <SurfaceCard className={styles.sectionCard}>
          <div className={styles.libraryCard}>
            <div className={styles.libraryHeader}>
              <Text size="2">
                パレット {palettePickerState.activePalette} / スロット{" "}
                {palettePickerState.activeSlot} に割り当てる色を選択
              </Text>
              <Badge color="teal" size="2" variant="surface">
                {`#${palettePickerState.activeColorIndex
                  .toString(16)
                  .padStart(2, "0")
                  .toUpperCase()}`}
              </Badge>
            </div>
            <div className={styles.colorRow}>
              {NES_PALETTE_HEX.map((hex, colorIndex) => {
                const buttonClassName =
                  colorIndex === palettePickerState.activeColorIndex
                    ? `${styles.colorButton} ${styles.colorButtonActive} ${resolvePaletteColorClassName(
                        colorIndex,
                      )}`
                    : `${styles.colorButton} ${resolvePaletteColorClassName(
                        colorIndex,
                      )}`;

                return (
                  <button
                    key={colorIndex}
                    type="button"
                    aria-label={`NES色 #${colorIndex
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase()}`}
                    className={buttonClassName}
                    title={`#${colorIndex
                      .toString(16)
                      .padStart(2, "0")
                      .toUpperCase()}`}
                    onClick={() =>
                      palettePickerState.handleColorSelect(colorIndex)
                    }
                  >
                    <span className={styles.visuallyHidden}>{hex}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </SurfaceCard>
      ) : (
        <></>
      )}
    </div>
  );
};
