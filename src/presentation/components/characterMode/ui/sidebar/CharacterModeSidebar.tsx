import React from "react";
import styles from "../core/CharacterModeShell.module.css";
import { CharacterModeSidebarLibrary } from "./CharacterModeSidebarLibrary";

interface CharacterModeSidebarProps {
  children?: React.ReactNode;
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
}

/**
 * キャラクター編集ワークスペースの共通サイドバーを描画します。
 * ライブラリ一覧をまとめて扱います。
 */
export const CharacterModeSidebar: React.FC<CharacterModeSidebarProps> = ({
  children,
  handleLibraryPointerDown,
}) => {
  const sidebarSections = React.Children.toArray(children);

  return (
    <div
      className={styles.sidebar}
      role="complementary"
      aria-label="キャラクター編集サイドバー"
    >
      {sidebarSections.map((child, index) => (
        <div key={`sidebar-section-${index}`} className={styles.sidebarSection}>
          {child}
        </div>
      ))}
      <div className={styles.sidebarSection}>
        <CharacterModeSidebarLibrary
          handleLibraryPointerDown={handleLibraryPointerDown}
        />
      </div>
    </div>
  );
};
