import React from "react";
import styles from "./SpriteModeWorkspace.module.css";

interface SpriteModeWorkspaceProps {
  canvasPanel: React.ReactNode;
  editorPanel: React.ReactNode;
}

/**
 * spriteMode の 2 ペインレイアウトだけを担当します。
 */
export const SpriteModeWorkspace: React.FC<SpriteModeWorkspaceProps> = ({
  canvasPanel,
  editorPanel,
}) => {
  return (
    <section className={styles.root} aria-label="スプライト編集ワークスペース">
      {editorPanel}
      {canvasPanel}
    </section>
  );
};
