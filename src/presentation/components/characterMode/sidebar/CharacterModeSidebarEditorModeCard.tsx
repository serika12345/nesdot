import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../../App.styles";
import {
  useCharacterModeEditorModeSetting,
  useCharacterModeSetSelection,
} from "../core/CharacterModeStateProvider";

const OptionGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(0.75),
  width: "10.5rem",
}));

const WideToolButton = styled(ToolButton)({
  width: "100%",
});

/**
 * 編集モード切り替えカードです。
 */
export const CharacterModeSidebarEditorModeCard: React.FC = () => {
  const editorMode = useCharacterModeEditorModeSetting();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <OptionGrid>
      <WideToolButton
        type="button"
        aria-label="編集モード 合成"
        active={editorMode.editorMode === "compose"}
        disabled={isDisabled}
        onClick={() => editorMode.handleEditorModeChange("compose")}
      >
        合成
      </WideToolButton>
      <WideToolButton
        type="button"
        aria-label="編集モード 分解"
        active={editorMode.editorMode === "decompose"}
        disabled={isDisabled}
        onClick={() => editorMode.handleEditorModeChange("decompose")}
      >
        分解
      </WideToolButton>
    </OptionGrid>
  );
};
