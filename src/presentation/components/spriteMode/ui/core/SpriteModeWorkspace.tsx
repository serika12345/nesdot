import React from "react";
import styles from "./SpriteModeWorkspace.module.css";

interface SpriteModeWorkspaceProps {
  canvasPanel: React.ReactNode;
  libraryPanel: React.ReactNode;
}

/**
 * spriteMode の 2 ペインレイアウトだけを担当します。
 */
export const SpriteModeWorkspace: React.FC<SpriteModeWorkspaceProps> = ({
  canvasPanel,
  libraryPanel,
}) => {
  return (
    <section className={styles.root} aria-label="スプライト編集ワークスペース">
      {libraryPanel}
      {canvasPanel}
    </section>
  );
};
