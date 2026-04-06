import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import {
  useCharacterModeSetSelection,
  useCharacterModeSpriteSize,
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
 * プロジェクトのスプライトサイズ切り替えカードです。
 */
export const CharacterModeSidebarSpriteSizeCard: React.FC = () => {
  const spriteSize = useCharacterModeSpriteSize();
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
            aria-label="プロジェクトスプライトサイズ 8x8"
            active={spriteSize.projectSpriteSize === 8}
            disabled={
              isDisabled ||
              (spriteSize.projectSpriteSizeLocked === true &&
                spriteSize.projectSpriteSize !== 8)
            }
            onClick={() => spriteSize.handleProjectSpriteSizeChange(8)}
          >
            8×8
          </WideToolButton>
          <WideToolButton
            type="button"
            aria-label="プロジェクトスプライトサイズ 8x16"
            active={spriteSize.projectSpriteSize === 16}
            disabled={
              isDisabled ||
              (spriteSize.projectSpriteSizeLocked === true &&
                spriteSize.projectSpriteSize !== 16)
            }
            onClick={() => spriteSize.handleProjectSpriteSizeChange(16)}
          >
            8×16
          </WideToolButton>
        </OptionGrid>
      </Stack>
    </CharacterModeEditorCard>
  );
};
