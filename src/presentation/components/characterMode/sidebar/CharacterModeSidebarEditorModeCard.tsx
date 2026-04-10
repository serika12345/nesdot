import { Box } from "@mui/material";
import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../../App.styles";
import {
  useCharacterModeEditorModeSetting,
  useCharacterModeSetSelection,
} from "../core/CharacterModeStateProvider";

const fullWidthStyle: React.CSSProperties = {
  width: "100%",
};

/**
 * 編集モード切り替えカードです。
 */
export const CharacterModeSidebarEditorModeCard: React.FC = () => {
  const editorMode = useCharacterModeEditorModeSetting();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(2, minmax(0, 1fr))"
      gap={0.75}
      width="10.5rem"
    >
      <ToolButton
        type="button"
        aria-label="編集モード 合成"
        active={editorMode.editorMode === "compose"}
        style={fullWidthStyle}
        disabled={isDisabled}
        onClick={() => editorMode.handleEditorModeChange("compose")}
      >
        合成
      </ToolButton>
      <ToolButton
        type="button"
        aria-label="編集モード 分解"
        active={editorMode.editorMode === "decompose"}
        style={fullWidthStyle}
        disabled={isDisabled}
        onClick={() => editorMode.handleEditorModeChange("decompose")}
      >
        分解
      </ToolButton>
    </Box>
  );
};
