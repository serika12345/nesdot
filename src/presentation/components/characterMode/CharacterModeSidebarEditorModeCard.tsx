import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import {
  useCharacterModeEditorModeSetting,
  useCharacterModeSetSelection,
} from "./CharacterModeStateProvider";

const OptionGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1.25rem",
});

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
    <CharacterModeEditorCard
      minHeight={0}
      spacing="0.875rem"
      p="1rem"
      useFlexGap
    >
      <Stack spacing="0.625rem">
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
      </Stack>
    </CharacterModeEditorCard>
  );
};
