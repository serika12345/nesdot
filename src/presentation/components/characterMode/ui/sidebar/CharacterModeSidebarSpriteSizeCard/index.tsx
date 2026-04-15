import Button from "@mui/material/Button";
import * as O from "fp-ts/Option";
import React from "react";
import {
  useCharacterModeSetSelection,
  useCharacterModeSpriteSize,
} from "../../core/CharacterModeStateProvider";
import { SidebarToggleGrid } from "../../primitives/CharacterModePrimitives";

/**
 * プロジェクトのスプライトサイズ切り替えカードです。
 */
export const CharacterModeSidebarSpriteSizeCard: React.FC = () => {
  const spriteSize = useCharacterModeSpriteSize();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <SidebarToggleGrid>
      <Button
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x8"
        fullWidth
        size="small"
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 8)
        }
        variant={spriteSize.projectSpriteSize === 8 ? "contained" : "outlined"}
        onClick={() => spriteSize.handleProjectSpriteSizeChange(8)}
      >
        8×8
      </Button>
      <Button
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x16"
        fullWidth
        size="small"
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 16)
        }
        variant={spriteSize.projectSpriteSize === 16 ? "contained" : "outlined"}
        onClick={() => spriteSize.handleProjectSpriteSizeChange(16)}
      >
        8×16
      </Button>
    </SidebarToggleGrid>
  );
};
