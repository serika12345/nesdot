import * as O from "fp-ts/Option";
import React from "react";
import { AppButton } from "../../../common/ui/forms/AppControls";
import {
  useCharacterModeEditorModeSetting,
  useCharacterModeSetSelection,
} from "../../logic/characterModeEditorState";
import styles from "../core/CharacterModeShell.module.css";

/**
 * 編集モード切り替えカードです。
 */
export const CharacterModeSidebarEditorModeCard: React.FC = () => {
  const editorMode = useCharacterModeEditorModeSetting();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <div className={styles.toggleGrid}>
      <AppButton
        type="button"
        aria-label="編集モード 合成"
        fullWidth
        size="small"
        disabled={isDisabled}
        tone={editorMode.editorMode === "compose" ? "accent" : "neutral"}
        variant={editorMode.editorMode === "compose" ? "solid" : "outline"}
        onClick={() => editorMode.handleEditorModeChange("compose")}
      >
        合成
      </AppButton>
      <AppButton
        type="button"
        aria-label="編集モード 分解"
        fullWidth
        size="small"
        disabled={isDisabled}
        variant={editorMode.editorMode === "decompose" ? "solid" : "outline"}
        tone={editorMode.editorMode === "decompose" ? "accent" : "neutral"}
        onClick={() => editorMode.handleEditorModeChange("decompose")}
      >
        分解
      </AppButton>
    </div>
  );
};
