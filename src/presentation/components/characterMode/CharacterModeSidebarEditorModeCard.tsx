import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { FieldLabel, ToolButton } from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import { useCharacterModeEditorModeSetting } from "./CharacterModeStateProvider";

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

  return (
    <CharacterModeEditorCard minHeight={0} spacing="0.875rem" p="1rem" useFlexGap>
      <Stack component="label" spacing="0.625rem">
        <FieldLabel>編集モード</FieldLabel>
        <OptionGrid>
          <WideToolButton
            type="button"
            aria-label="編集モード 合成"
            active={editorMode.editorMode === "compose"}
            onClick={() => editorMode.handleEditorModeChange("compose")}
          >
            合成
          </WideToolButton>
          <WideToolButton
            type="button"
            aria-label="編集モード 分解"
            active={editorMode.editorMode === "decompose"}
            onClick={() => editorMode.handleEditorModeChange("decompose")}
          >
            分解
          </WideToolButton>
        </OptionGrid>
      </Stack>
    </CharacterModeEditorCard>
  );
};
