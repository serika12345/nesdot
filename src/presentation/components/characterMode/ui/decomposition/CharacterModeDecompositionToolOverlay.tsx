import React from "react";
import { AppButton, AppIconButton } from "../../../common/ui/forms/AppControls";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { CharacterModeDecompositionToolCard } from "./CharacterModeDecompositionToolCard";
import styles from "./CharacterModeDecomposition.module.css";

/**
 * 分解キャンバス上に重なるツールメニューを描画します。
 * ペン・消しゴム・切り取りとパレット操作をキャンバス近くに集約します。
 */
export const CharacterModeDecompositionToolOverlay: React.FC = () => {
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);

  return (
    <div className={styles.overlayRoot}>
      {isToolsOpen === true ? (
        <AppButton
          tone="accent"
          variant="solid"
          onClick={() => setIsToolsOpen((previous) => !previous)}
        >
          分解ツールを閉じる
          <ChevronDownIcon className={styles.chevron} data-open="true" />
        </AppButton>
      ) : (
        <AppIconButton
          aria-label="分解ツールを開く"
          className={styles.collapsedToggle}
          onClick={() => setIsToolsOpen((previous) => !previous)}
        >
          <ChevronDownIcon className={styles.chevron} data-open="false" />
        </AppIconButton>
      )}

      {isToolsOpen === true ? (
        <div className={styles.overlayMenu}>
          <CharacterModeDecompositionToolCard />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
