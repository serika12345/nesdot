import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { nesIndexToCssHex } from "../../../../../../domain/nes/palette";
import { DECOMPOSITION_COLOR_SLOTS } from "../../../logic/characterModeConstants";
import {
  useCharacterModeDecompositionPalette,
  useCharacterModeDecompositionTool,
} from "../../../logic/characterModeDecompositionState";
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

const PaletteSlotButton: React.FC<PaletteSlotButtonProps> = ({
  colorHex,
  selectedState,
  style,
  ...props
}) => {
  return (
    <ButtonBase
      {...props}
      data-selected-state={selectedState === true ? "true" : "false"}
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
    <CharacterModeEditorCard
      minHeight={0}
      spacing="0.875rem"
      p="1rem"
      useFlexGap
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        useFlexGap
        flexWrap="wrap"
      >
        <Typography variant="body2">分解ツール</Typography>
        <Chip
          size="small"
          variant="outlined"
          label={decompositionTool.projectSpriteSize === 8 ? "8×8" : "8×16"}
        />
      </Stack>

      <DecompositionToolGrid>
        <Button
          type="button"
          aria-label="分解ツール ペン"
          size="small"
          variant={
            decompositionTool.decompositionTool === "pen"
              ? "contained"
              : "outlined"
          }
          onClick={() => decompositionTool.handleDecompositionToolChange("pen")}
        >
          ペン
        </Button>
        <Button
          type="button"
          aria-label="分解ツール 消しゴム"
          size="small"
          variant={
            decompositionTool.decompositionTool === "eraser"
              ? "contained"
              : "outlined"
          }
          onClick={() =>
            decompositionTool.handleDecompositionToolChange("eraser")
          }
        >
          消しゴム
        </Button>
        <Button
          type="button"
          aria-label="分解ツール 切り取り"
          size="small"
          variant={
            decompositionTool.decompositionTool === "region"
              ? "contained"
              : "outlined"
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
