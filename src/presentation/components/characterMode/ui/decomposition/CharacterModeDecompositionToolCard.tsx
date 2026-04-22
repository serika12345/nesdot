import React from "react";
import { nesIndexToCssHex } from "../../../../../domain/nes/palette";
import {
  AppBadge,
  AppButton,
  AppSelect,
} from "../../../common/ui/forms/AppControls";
import { DECOMPOSITION_COLOR_SLOTS } from "../../logic/characterModeConstants";
import {
  useCharacterModeDecompositionPalette,
  useCharacterModeDecompositionTool,
} from "../../logic/characterModeDecompositionState";
import { CharacterModeEditorCard } from "../editor/CharacterModeEditorCard";
import {
  DecompositionToolGrid,
  PaletteControlContainer,
  PaletteControlRow,
  PaletteSlotGrid,
} from "../primitives/CharacterModePrimitives";
import { createPaletteSlotButtonStyle } from "./CharacterModeDecompositionToolCardStyle";
import styles from "./CharacterModeDecomposition.module.css";

type PaletteSlotButtonProps = React.ComponentProps<"button"> & {
  colorHex: string;
  selectedState?: boolean;
};

const PaletteSlotButton: React.FC<PaletteSlotButtonProps> = ({
  colorHex,
  selectedState,
  style,
  ...props
}) => {
  return (
    <button
      {...props}
      className={styles.slotButton}
      data-selected-state={selectedState === true ? "true" : "false"}
      type={props.type ?? "button"}
      style={createPaletteSlotButtonStyle(
        style ?? {},
        colorHex,
        selectedState === true,
      )}
    />
  );
};

/**
 * 分解モード専用のツールと描画パレット設定カードです。
 */
export const CharacterModeDecompositionToolCard: React.FC = () => {
  const decompositionTool = useCharacterModeDecompositionTool();
  const decompositionPalette = useCharacterModeDecompositionPalette();

  return (
    <CharacterModeEditorCard className={styles.toolCard}>
      <div className={styles.headerRow}>
        <span className={styles.title}>分解ツール</span>
        <AppBadge>
          {decompositionTool.projectSpriteSize === 8 ? "8×8" : "8×16"}
        </AppBadge>
      </div>

      <DecompositionToolGrid>
        <AppButton
          aria-label="分解ツール ペン"
          size="small"
          variant={
            decompositionTool.decompositionTool === "pen" ? "solid" : "outline"
          }
          tone={
            decompositionTool.decompositionTool === "pen" ? "accent" : "neutral"
          }
          onClick={() => decompositionTool.handleDecompositionToolChange("pen")}
        >
          ペン
        </AppButton>
        <AppButton
          aria-label="分解ツール 消しゴム"
          size="small"
          variant={
            decompositionTool.decompositionTool === "eraser"
              ? "solid"
              : "outline"
          }
          tone={
            decompositionTool.decompositionTool === "eraser"
              ? "accent"
              : "neutral"
          }
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("eraser")
          }
        >
          消しゴム
        </AppButton>
        <AppButton
          aria-label="分解ツール 切り取り"
          size="small"
          variant={
            decompositionTool.decompositionTool === "region"
              ? "solid"
              : "outline"
          }
          tone={
            decompositionTool.decompositionTool === "region"
              ? "accent"
              : "neutral"
          }
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("region")
          }
        >
          切り取り
        </AppButton>
      </DecompositionToolGrid>

      <PaletteControlRow>
        <PaletteControlContainer>
          <AppSelect
            aria-label="分解描画パレット"
            value={decompositionPalette.decompositionPaletteIndex}
            onChange={(event) => {
              const value = event.target.value;
              if (typeof value !== "string" && typeof value !== "number") {
                return;
              }

              decompositionPalette.handleDecompositionPaletteSelect(value);
            }}
          >
            {decompositionPalette.spritePalettes.map((_, paletteIndex) => (
              <option key={paletteIndex} value={paletteIndex}>
                パレット {paletteIndex}
              </option>
            ))}
          </AppSelect>
        </PaletteControlContainer>

        <PaletteSlotGrid>
          {DECOMPOSITION_COLOR_SLOTS.map((slotIndex) => {
            const isSelected =
              decompositionPalette.decompositionColorIndex === slotIndex &&
              decompositionTool.decompositionTool !== "eraser";
            const colorHex = nesIndexToCssHex(
              decompositionPalette.spritePalettes[
                decompositionPalette.decompositionPaletteIndex
              ][slotIndex],
            );

            return (
              <div
                key={`decompose-slot-${slotIndex}`}
                className={styles.slotEntry}
              >
                <PaletteSlotButton
                  type="button"
                  aria-label={`分解色スロット ${slotIndex}`}
                  selectedState={isSelected}
                  colorHex={colorHex}
                  onClick={() =>
                    decompositionPalette.handleDecompositionColorSlotSelect(
                      slotIndex,
                    )
                  }
                />
                <span className={styles.slotLabel}>{`slot${slotIndex}`}</span>
              </div>
            );
          })}
        </PaletteSlotGrid>
      </PaletteControlRow>
    </CharacterModeEditorCard>
  );
};
