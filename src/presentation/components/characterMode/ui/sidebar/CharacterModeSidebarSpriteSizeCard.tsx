import * as O from "fp-ts/Option";
import React from "react";
import { AppButton } from "../../../common/ui/forms/AppControls";
import {
  useCharacterModeSetSelection,
  useCharacterModeSpriteSize,
} from "../../logic/characterModeEditorState";
import styles from "../core/CharacterModeShell.module.css";

/**
 * プロジェクトのスプライトサイズ切り替えカードです。
 */
export const CharacterModeSidebarSpriteSizeCard: React.FC = () => {
  const spriteSize = useCharacterModeSpriteSize();
  const setSelection = useCharacterModeSetSelection();
  const isDisabled = O.isNone(setSelection.selectedCharacterId);

  return (
    <div className={styles.toggleGrid}>
      <AppButton
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x8"
        fullWidth
        size="small"
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 8)
        }
        tone={spriteSize.projectSpriteSize === 8 ? "accent" : "neutral"}
        variant={spriteSize.projectSpriteSize === 8 ? "solid" : "outline"}
        onClick={() => spriteSize.handleProjectSpriteSizeChange(8)}
      >
        8×8
      </AppButton>
      <AppButton
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x16"
        fullWidth
        size="small"
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 16)
        }
        tone={spriteSize.projectSpriteSize === 16 ? "accent" : "neutral"}
        variant={spriteSize.projectSpriteSize === 16 ? "solid" : "outline"}
        onClick={() => spriteSize.handleProjectSpriteSizeChange(16)}
      >
        8×16
      </AppButton>
    </div>
  );
};
