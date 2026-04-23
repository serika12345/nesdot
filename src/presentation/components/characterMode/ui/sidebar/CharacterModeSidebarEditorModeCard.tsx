import * as O from "fp-ts/Option";
import { Button } from "@radix-ui/themes";
import React from "react";
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
      <Button
        type="button"
        aria-label="編集モード 合成"
        color={editorMode.editorMode === "compose" ? "teal" : "gray"}
        disabled={isDisabled}
        size="1"
        style={{ width: "100%" }}
        variant={editorMode.editorMode === "compose" ? "solid" : "outline"}
        onClick={() => editorMode.handleEditorModeChange("compose")}
      >
        合成
      </Button>
      <Button
        type="button"
        aria-label="編集モード 分解"
        color={editorMode.editorMode === "decompose" ? "teal" : "gray"}
        disabled={isDisabled}
        size="1"
        style={{ width: "100%" }}
        variant={editorMode.editorMode === "decompose" ? "solid" : "outline"}
        onClick={() => editorMode.handleEditorModeChange("decompose")}
      >
        分解
      </Button>
    </div>
  );
};
