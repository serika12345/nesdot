import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../../../../App.styles";
import {
  useCharacterModeEditorModeSetting,
  useCharacterModeSetSelection,
} from "../../core/CharacterModeStateProvider";
import { SidebarToggleGrid } from "../../primitives/CharacterModePrimitives";
import { fullWidthStyle } from "./styles";

/**
 * 編集モード切り替えカードです。
 */
export const CharacterModeSidebarEditorModeCard: React.FC = () => {
  const editorMode = useCharacterModeEditorModeSetting();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <SidebarToggleGrid>
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
    </SidebarToggleGrid>
  );
};
