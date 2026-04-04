import {
  Chip,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import {
  PaletteIndex,
  ProjectSpriteSize,
} from "../../../application/state/projectStore";
import { type NesSpritePalettes } from "../../../domain/nes/nesProject";
import { Panel, PanelHeader, PanelTitle, ScrollArea } from "../../App.styles";

interface SpriteModeEditorPanelProps {
  activeSprite: number;
  activePalette: PaletteIndex;
  projectSpriteSize: ProjectSpriteSize;
  palettes: NesSpritePalettes;
  onSpriteChange: (index: string) => void;
  onPaletteChange: (index: string) => void;
}

export const SpriteModeEditorPanel: React.FC<SpriteModeEditorPanelProps> = ({
  activeSprite,
  activePalette,
  projectSpriteSize,
  palettes,
  onSpriteChange,
  onPaletteChange,
}) => {
  return (
    <Panel role="region" aria-label="スプライト編集パネル" minHeight={0}>
      <PanelHeader>
        <PanelTitle>スプライト編集</PanelTitle>
      </PanelHeader>

      <Stack component={ScrollArea} spacing={2} flex={1} minHeight={0}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          useFlexGap
          alignItems="stretch"
        >
          <FormControl fullWidth>
            <Typography variant="caption">スプライト番号</Typography>
            <OutlinedInput
              type="number"
              value={activeSprite}
              inputProps={{
                "aria-label": "スプライト番号",
                min: 0,
                max: 63,
                step: 1,
              }}
              onChange={(event) => onSpriteChange(event.target.value)}
            />
          </FormControl>
          <FormControl fullWidth>
            <Typography variant="caption">パレット</Typography>
            <Select
              variant="outlined"
              value={activePalette}
              inputProps={{
                "aria-label": "パレット",
              }}
              onChange={(event) => {
                const value = event.target.value;
                if (typeof value !== "string" && typeof value !== "number") {
                  return;
                }
                onPaletteChange(String(value));
              }}
            >
              {palettes.map((_, index) => (
                <MenuItem key={index} value={index}>
                  パレット {index}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Chip
          color="primary"
          variant="outlined"
          label={
            projectSpriteSize === 8
              ? "Project Sprite Size 8x8"
              : "Project Sprite Size 8x16"
          }
        />
      </Stack>
    </Panel>
  );
};
