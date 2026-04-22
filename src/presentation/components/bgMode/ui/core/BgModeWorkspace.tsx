import React from "react";
import styles from "../panels/BgModePanels.module.css";

interface BgModeWorkspaceProps {
  editorPanel: React.ReactNode;
  libraryPanel: React.ReactNode;
}

/**
 * bgMode の 2 ペインレイアウトだけを担当します。
 */
export const BgModeWorkspace: React.FC<BgModeWorkspaceProps> = ({
  editorPanel,
  libraryPanel,
}) => {
  return (
    <section className={styles.workspace} aria-label="BG編集ワークスペース">
      {libraryPanel}
      {editorPanel}
    </section>
  );
};
