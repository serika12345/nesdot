import React from "react";
import styles from "./CharacterModeShell.module.css";

interface CharacterModeWorkspaceProps {
  isWorkspaceLocked: boolean;
  sidebarContent: React.ReactNode;
  workspaceContent: React.ReactNode;
}

/**
 * CharacterMode のワークスペースレイアウトとロックオーバーレイだけを担当します。
 */
export const CharacterModeWorkspace: React.FC<CharacterModeWorkspaceProps> = ({
  isWorkspaceLocked,
  sidebarContent,
  workspaceContent,
}) => {
  return (
    <div className={styles.workspaceFrame}>
      <div
        className={styles.workspaceGrid}
        aria-label="キャラクター編集ワークスペース"
        aria-disabled={isWorkspaceLocked}
      >
        <div className={styles.workspaceSidebar}>{sidebarContent}</div>
        <div className={styles.workspaceStage}>{workspaceContent}</div>
      </div>

      {isWorkspaceLocked === true ? (
        <div
          aria-label="キャラクター編集ロックオーバーレイ"
          className={styles.workspaceLockOverlay}
        >
          <div className={styles.workspaceLockMessage}>
            セットを作成すると編集できます
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
