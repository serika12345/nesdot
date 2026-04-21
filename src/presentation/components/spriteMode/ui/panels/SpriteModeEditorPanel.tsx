import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React from "react";
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
    <Paper
      variant="outlined"
      role="region"
      aria-label="スプライト編集パネル"
      className={styles.root}
    >
      <div className={styles.header}>
        <Typography component="h2" variant="h2" color="text.primary">
          スプライト編集
        </Typography>
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>
          <SpriteModeEditorSelectionFields
            selectionFields={editorPanelState.selectionFields}
          />

          <Chip
            color="primary"
            variant="outlined"
            label={
              editorPanelState.projectSpriteSize === 8
                ? "Project Sprite Size 8x8"
                : "Project Sprite Size 8x16"
            }
          />
        </div>
      </div>
    </Paper>
  );
};
