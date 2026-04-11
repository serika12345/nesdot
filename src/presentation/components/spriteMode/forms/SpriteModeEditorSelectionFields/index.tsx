import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { useSpriteModeSelection } from "../../core/SpriteModeStateProvider";

/**
 * 編集対象スプライト番号とパレット選択欄です。
 */
export const SpriteModeEditorSelectionFields: React.FC = () => {
  const selection = useSpriteModeSelection();

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
          value={selection.activeSprite}
          inputProps={{
            "aria-label": "スプライト番号",
            min: 0,
            max: 63,
            step: 1,
          }}
          onChange={(event) => selection.handleSpriteChange(event.target.value)}
        />
      </FormControl>
      <FormControl fullWidth>
        <Typography variant="caption">パレット</Typography>
        <Select
          variant="outlined"
          value={selection.activePalette}
          inputProps={{
            "aria-label": "パレット",
          }}
          onChange={(event) => {
            const value = event.target.value;
            if (typeof value !== "string" && typeof value !== "number") {
              return;
            }
            selection.handlePaletteChange(String(value));
          }}
        >
          {selection.palettes.map((_, index) => (
            <MenuItem key={index} value={index}>
              パレット {index}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};
