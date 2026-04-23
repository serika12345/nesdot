import * as O from "fp-ts/Option";
import { Button } from "@radix-ui/themes";
import React from "react";
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
      <Button
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x8"
        color={spriteSize.projectSpriteSize === 8 ? "teal" : "gray"}
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 8)
        }
        size="1"
        style={{ width: "100%" }}
        variant={spriteSize.projectSpriteSize === 8 ? "solid" : "outline"}
        onClick={() => spriteSize.handleProjectSpriteSizeChange(8)}
      >
        8×8
      </Button>
      <Button
        type="button"
        aria-label="プロジェクトスプライトサイズ 8x16"
        color={spriteSize.projectSpriteSize === 16 ? "teal" : "gray"}
        disabled={
          isDisabled ||
          (spriteSize.projectSpriteSizeLocked === true &&
            spriteSize.projectSpriteSize !== 16)
        }
        size="1"
        style={{ width: "100%" }}
        variant={spriteSize.projectSpriteSize === 16 ? "solid" : "outline"}
        onClick={() => spriteSize.handleProjectSpriteSizeChange(16)}
      >
        8×16
      </Button>
    </div>
  );
};
