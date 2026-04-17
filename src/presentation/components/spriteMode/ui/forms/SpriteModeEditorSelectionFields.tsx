import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { type SpriteModeSelectionFieldsState } from "../../logic/spriteModeEditorState";

interface SpriteModeEditorSelectionFieldsProps {
  selectionFields: SpriteModeSelectionFieldsState;
}

/**
 * 編集対象スプライト番号とパレット選択欄です。
 */
export const SpriteModeEditorSelectionFields: React.FC<
  SpriteModeEditorSelectionFieldsProps
> = ({ selectionFields }) => {
  return (
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
          value={selectionFields.activeSprite}
          inputProps={{
            "aria-label": "スプライト番号",
            min: 0,
            max: 63,
            step: 1,
          }}
          onChange={(event) =>
            selectionFields.handleSpriteChange(event.target.value)
          }
        />
      </FormControl>
      <FormControl fullWidth>
        <Typography variant="caption">パレット</Typography>
        <Select
          variant="outlined"
          value={selectionFields.activePalette}
          inputProps={{
            "aria-label": "パレット",
          }}
          onChange={(event) => {
            const value = event.target.value;
            if (typeof value !== "string" && typeof value !== "number") {
              return;
            }
            selectionFields.handlePaletteChange(String(value));
          }}
        >
          {selectionFields.palettes.map((_, index) => (
            <MenuItem key={index} value={index}>
              パレット {index}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};
