import { Box } from "@mui/material";
import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../../App.styles";
import {
  useCharacterModeSetSelection,
  useCharacterModeSpriteSize,
} from "../core/CharacterModeStateProvider";

const fullWidthStyle: React.CSSProperties = {
  width: "100%",
};

/**
 * プロジェクトのスプライトサイズ切り替えカードです。
 */
export const CharacterModeSidebarSpriteSizeCard: React.FC = () => {
  const spriteSize = useCharacterModeSpriteSize();
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
        aria-label="プロジェクトスプライトサイズ 8x8"
        active={spriteSize.projectSpriteSize === 8}
        style={fullWidthStyle}
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 8)
        }
        onClick={() => spriteSize.handleProjectSpriteSizeChange(8)}
      >
        8×8
      </ToolButton>
      <ToolButton
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x16"
        active={spriteSize.projectSpriteSize === 16}
        style={fullWidthStyle}
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 16)
        }
        onClick={() => spriteSize.handleProjectSpriteSizeChange(16)}
      >
        8×16
      </ToolButton>
    </Box>
  );
};
