import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import { ToolButton } from "../../App.styles";
import {
  useCharacterModeSetSelection,
  useCharacterModeSpriteSize,
} from "./CharacterModeStateProvider";

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
 * プロジェクトのスプライトサイズ切り替えカードです。
 */
export const CharacterModeSidebarSpriteSizeCard: React.FC = () => {
  const spriteSize = useCharacterModeSpriteSize();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
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
  );
};
