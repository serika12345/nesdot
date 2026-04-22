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
      <label className={styles.field}>
        <span className={styles.label}>スプライト番号</span>
        <input
          className={styles.input}
          type="number"
          value={selectionFields.activeSprite}
          aria-label="スプライト番号"
          min={0}
          max={63}
          step={1}
          onChange={(event) =>
            selectionFields.handleSpriteChange(event.target.value)
          }
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>パレット</span>
        <select
          className={styles.select}
          value={selectionFields.activePalette}
          aria-label="パレット"
          onChange={(event) => {
            const value = event.target.value;
            if (typeof value !== "string" && typeof value !== "number") {
              return;
            }
            selectionFields.handlePaletteChange(String(value));
          }}
        >
          {selectionFields.palettes.map((_, index) => (
            <option key={index} value={index}>
              パレット {index}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
