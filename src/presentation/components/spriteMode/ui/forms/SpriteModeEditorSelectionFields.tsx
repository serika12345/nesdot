import { Select } from "@radix-ui/themes";
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
  const paletteOptions = selectionFields.palettes.map((_, index) => ({
    label: `パレット ${index}`,
    value: String(index),
  }));
  const activePaletteLabel =
    paletteOptions.find(
      (option) => option.value === String(selectionFields.activePalette),
    )?.label ?? "パレット";

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
        <Select.Root
          value={String(selectionFields.activePalette)}
          onValueChange={(value) => {
            selectionFields.handlePaletteChange(value);
          }}
        >
          <Select.Trigger aria-label="パレット" className={styles.select}>
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
      </label>
    </div>
  );
};
