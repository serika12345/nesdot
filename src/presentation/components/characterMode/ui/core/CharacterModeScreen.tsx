import React from "react";
import { CharacterModeSetDraftFields } from "../set/CharacterModeSetDraftFields";
import { CharacterModeSetSelectionFields } from "../set/CharacterModeSetSelectionFields";
import { CharacterModeSidebarEditorModeCard } from "../sidebar/CharacterModeSidebarEditorModeCard";
import { CharacterModeSidebarSpriteSizeCard } from "../sidebar/CharacterModeSidebarSpriteSizeCard";
import { CharacterModeGestureWorkspace } from "./CharacterModeGestureWorkspace";
import styles from "./CharacterModeShell.module.css";

/**
 * キャラクター編集画面の shell を描画します。
 * 操作列、ワークスペース、コンテキストメニューの配置だけを担当します。
 */
export const CharacterModeScreen: React.FC = () => {
  return (
    <section className={styles.screenRoot}>
      <header className={styles.toolbarRow}>
        <div className={styles.toolbarGroup}>
          <CharacterModeSidebarEditorModeCard />
          <CharacterModeSidebarSpriteSizeCard />
          <CharacterModeSetDraftFields />
        </div>
        <div className={styles.toolbarGroupEnd}>
          <CharacterModeSetSelectionFields />
        </div>
      </header>

      <CharacterModeGestureWorkspace />
    </section>
  );
};
