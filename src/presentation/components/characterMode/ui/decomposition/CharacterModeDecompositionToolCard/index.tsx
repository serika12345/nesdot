import ButtonBase from "@mui/material/ButtonBase";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { nesIndexToCssHex } from "../../../../../../domain/nes/palette";
import {
  Badge,
  FieldLabel,
  PanelHeaderRow,
  ToolButton,
} from "../../../../../App.styles";
import { CHARACTER_DECOMPOSITION_PALETTE_SLOT_BUTTON_CLASS_NAME } from "../../../../../styleClassNames";
import { DECOMPOSITION_COLOR_SLOTS } from "../../../logic/characterModeConstants";
import {
  useCharacterModeDecompositionPalette,
  useCharacterModeDecompositionTool,
} from "../../core/CharacterModeStateProvider";
import { CharacterModeEditorCard } from "../../editor/CharacterModeEditorCard";
import {
  DecompositionToolGrid,
  PaletteControlContainer,
  PaletteControlRow,
  PaletteSlotGrid,
} from "../../primitives/CharacterModePrimitives";
import { createPaletteSlotButtonStyle } from "./styles";

type PaletteSlotButtonProps = React.ComponentProps<typeof ButtonBase> & {
  colorHex: string;
  selectedState?: boolean;
};

const toBooleanDataValue = (value?: boolean): "true" | "false" =>
  value === true ? "true" : "false";
const PaletteSlotButton: React.FC<PaletteSlotButtonProps> = ({
  colorHex,
  selectedState,
  style,
  ...props
}) => {
  return (
    <ButtonBase
      {...props}
      className={CHARACTER_DECOMPOSITION_PALETTE_SLOT_BUTTON_CLASS_NAME}
      data-selected-state={toBooleanDataValue(selectedState)}
      style={createPaletteSlotButtonStyle(style ?? {}, colorHex)}
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
    <CharacterModeEditorCard
      minHeight={0}
      spacing="0.875rem"
      p="1rem"
      useFlexGap
    >
      <PanelHeaderRow>
        <FieldLabel>分解ツール</FieldLabel>
        <Badge tone="neutral">
          {decompositionTool.projectSpriteSize === 8 ? "8×8" : "8×16"}
        </Badge>
      </PanelHeaderRow>

      <DecompositionToolGrid>
        <ToolButton
          type="button"
          aria-label="分解ツール ペン"
          active={decompositionTool.decompositionTool === "pen"}
          onClick={() => decompositionTool.handleDecompositionToolChange("pen")}
        >
          ペン
        </ToolButton>
        <ToolButton
          type="button"
          aria-label="分解ツール 消しゴム"
          active={decompositionTool.decompositionTool === "eraser"}
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("eraser")
          }
        >
          消しゴム
        </ToolButton>
        <ToolButton
          type="button"
          aria-label="分解ツール 切り取り"
          active={decompositionTool.decompositionTool === "region"}
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("region")
          }
        >
          切り取り
        </ToolButton>
      </DecompositionToolGrid>

      <PaletteControlRow>
        <PaletteControlContainer>
          <Select
            variant="outlined"
            value={decompositionPalette.decompositionPaletteIndex}
            inputProps={{
              "aria-label": "分解描画パレット",
            }}
            onChange={(event) => {
              const value = event.target.value;
              if (typeof value !== "string" && typeof value !== "number") {
                return;
              }

              decompositionPalette.handleDecompositionPaletteSelect(value);
            }}
          >
            {decompositionPalette.spritePalettes.map((_, paletteIndex) => (
              <MenuItem key={paletteIndex} value={paletteIndex}>
                パレット {paletteIndex}
              </MenuItem>
            ))}
          </Select>
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
              <Stack
                key={`decompose-slot-${slotIndex}`}
                alignItems="center"
                spacing="0.5rem"
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
                <Typography variant="caption">{`slot${slotIndex}`}</Typography>
              </Stack>
            );
          })}
        </PaletteSlotGrid>
      </PaletteControlRow>
    </CharacterModeEditorCard>
  );
};
