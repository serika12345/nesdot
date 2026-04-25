import React from "react";
import { Button, IconButton } from "@radix-ui/themes";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import { mergeClassNames } from "../../../../styleClassNames";
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
        <Button
          color="teal"
          variant="solid"
          onClick={() => setIsToolsOpen((previous) => !previous)}
        >
          分解ツールを閉じる
          <ChevronDownIcon
            className={mergeClassNames(
              styles.chevron ?? "",
              styles.chevronOpen ?? "",
            )}
          />
        </Button>
      ) : (
        <IconButton
          aria-label="分解ツールを開く"
          className={styles.collapsedToggle}
          color="gray"
          onClick={() => setIsToolsOpen((previous) => !previous)}
          variant="surface"
        >
          <ChevronDownIcon className={styles.chevron} />
        </IconButton>
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
