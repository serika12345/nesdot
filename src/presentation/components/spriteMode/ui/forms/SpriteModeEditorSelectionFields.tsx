import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import React from "react";
import { type SpriteModeSelectionFieldsState } from "../../logic/spriteModeEditorState";
import styles from "./SpriteModeEditorSelectionFields.module.css";

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
    <div className={styles.root}>
      <FormControl fullWidth className={styles.field}>
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
      <FormControl fullWidth className={styles.field}>
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
    </div>
  );
};
