import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { Badge, FieldLabel, PanelHeaderRow, ToolButton } from "../../App.styles";
import { CharacterModeEditorCard } from "./CharacterModeEditorCard";
import { useCharacterModeSpriteSize } from "./CharacterModeStateProvider";

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

  return (
    <CharacterModeEditorCard minHeight={0} spacing="0.875rem" p="1rem" useFlexGap>
      <Stack component="label" spacing="0.625rem">
        <PanelHeaderRow>
          <FieldLabel>スプライト単位</FieldLabel>
          <Badge tone={spriteSize.projectSpriteSizeLocked ? "neutral" : "accent"}>
            {spriteSize.projectSpriteSizeLocked === true ? "locked" : "editable"}
          </Badge>
        </PanelHeaderRow>
        <OptionGrid>
          <WideToolButton
            type="button"
            aria-label="プロジェクトスプライトサイズ 8x8"
            active={spriteSize.projectSpriteSize === 8}
            disabled={
              spriteSize.projectSpriteSizeLocked === true &&
              spriteSize.projectSpriteSize !== 8
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
              spriteSize.projectSpriteSizeLocked === true &&
              spriteSize.projectSpriteSize !== 16
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
