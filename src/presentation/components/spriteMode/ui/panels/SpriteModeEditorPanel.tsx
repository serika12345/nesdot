import { Badge, Heading } from "@radix-ui/themes";
import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { type SpriteModeEditorPanelState } from "../../logic/spriteModeEditorState";
import { SpriteModeEditorSelectionFields } from "../forms/SpriteModeEditorSelectionFields";
import styles from "./SpriteModeEditorPanel.module.css";

interface SpriteModeEditorPanelProps {
  editorPanelState: SpriteModeEditorPanelState;
}

/**
 * スプライト番号とパレットを切り替える編集サイドパネルです。
 * 現在操作中の対象を明示し、キャンバス編集前の基本設定をまとめて扱えるようにします。
 */
export const SpriteModeEditorPanel: React.FC<SpriteModeEditorPanelProps> = ({
  editorPanelState,
}) => {
  return (
    <SurfaceCard
      role="region"
      aria-label="スプライト編集パネル"
      className={styles.root}
    >
      <div className={styles.header}>
        <Heading as="h2" size="5">
          スプライト編集
        </Heading>
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>
          <SpriteModeEditorSelectionFields
            selectionFields={editorPanelState.selectionFields}
          />

          <Badge color="teal" size="2" variant="surface">
            {editorPanelState.projectSpriteSize === 8
              ? "Project Sprite Size 8x8"
              : "Project Sprite Size 8x16"}
          </Badge>
        </div>
      </div>
    </SurfaceCard>
  );
};
