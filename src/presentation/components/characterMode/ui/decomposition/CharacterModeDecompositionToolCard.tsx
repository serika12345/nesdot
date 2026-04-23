import { Badge, Button, Select } from "@radix-ui/themes";
import React from "react";
import { nesIndexToCssHex } from "../../../../../domain/nes/palette";
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
  const paletteOptions = decompositionPalette.spritePalettes.map(
    (_, paletteIndex) => ({
      label: `パレット ${paletteIndex}`,
      value: String(paletteIndex),
    }),
  );
  const activePaletteLabel =
    paletteOptions.find(
      (option) =>
        option.value === String(decompositionPalette.decompositionPaletteIndex),
    )?.label ?? "パレット";

  return (
    <CharacterModeEditorCard className={styles.toolCard}>
      <div className={styles.headerRow}>
        <span className={styles.title}>分解ツール</span>
        <Badge color="gray" size="2" variant="surface">
          {decompositionTool.projectSpriteSize === 8 ? "8×8" : "8×16"}
        </Badge>
      </div>

      <DecompositionToolGrid>
        <Button
          aria-label="分解ツール ペン"
          color={
            decompositionTool.decompositionTool === "pen" ? "teal" : "gray"
          }
          size="1"
          variant={
            decompositionTool.decompositionTool === "pen" ? "solid" : "outline"
          }
          onClick={() => decompositionTool.handleDecompositionToolChange("pen")}
        >
          ペン
        </Button>
        <Button
          aria-label="分解ツール 消しゴム"
          color={
            decompositionTool.decompositionTool === "eraser" ? "teal" : "gray"
          }
          size="1"
          variant={
            decompositionTool.decompositionTool === "eraser"
              ? "solid"
              : "outline"
          }
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("eraser")
          }
        >
          消しゴム
        </Button>
        <Button
          aria-label="分解ツール 切り取り"
          color={
            decompositionTool.decompositionTool === "region" ? "teal" : "gray"
          }
          size="1"
          variant={
            decompositionTool.decompositionTool === "region"
              ? "solid"
              : "outline"
          }
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("region")
          }
        >
          切り取り
        </Button>
      </DecompositionToolGrid>

      <PaletteControlRow>
        <PaletteControlContainer>
          <Select.Root
            value={String(decompositionPalette.decompositionPaletteIndex)}
            onValueChange={(value) => {
              decompositionPalette.handleDecompositionPaletteSelect(value);
            }}
          >
            <Select.Trigger
              aria-label="分解描画パレット"
              style={{ width: "100%" }}
            >
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
