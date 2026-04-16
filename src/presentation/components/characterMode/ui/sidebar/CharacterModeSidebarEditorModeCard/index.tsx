import Button from "@mui/material/Button";
import * as O from "fp-ts/Option";
import React from "react";
import {
  useCharacterModeEditorModeSetting,
  useCharacterModeSetSelection,
} from "../../../logic/characterModeEditorState";
import { SidebarToggleGrid } from "../../primitives/CharacterModePrimitives";

/**
 * 編集モード切り替えカードです。
 */
export const CharacterModeSidebarEditorModeCard: React.FC = () => {
  const editorMode = useCharacterModeEditorModeSetting();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <SidebarToggleGrid>
      <Button
        type="button"
        aria-label="編集モード 合成"
        fullWidth
        size="small"
        disabled={isDisabled}
        variant={editorMode.editorMode === "compose" ? "contained" : "outlined"}
        onClick={() => editorMode.handleEditorModeChange("compose")}
      >
        合成
      </Button>
      <Button
        type="button"
        aria-label="編集モード 分解"
        fullWidth
        size="small"
        disabled={isDisabled}
        variant={
          editorMode.editorMode === "decompose" ? "contained" : "outlined"
        }
        onClick={() => editorMode.handleEditorModeChange("decompose")}
      >
        分解
      </Button>
    </SidebarToggleGrid>
  );
};
