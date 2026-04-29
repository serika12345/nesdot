import { Button, IconButton } from "@radix-ui/themes";
import React from "react";
import { ChevronDownIcon } from "../../../common/ui/icons/AppIcons";
import styles from "./CharacterModeDecomposition.module.css";
import { CharacterModeDecompositionToolCard } from "./CharacterModeDecompositionToolCard";

/**
 * 分解キャンバス上に重なるツールメニューを描画します。
 * ペン・消しゴム・切り取りとパレット操作をキャンバス近くに集約します。
 */
export const CharacterModeDecompositionToolOverlay: React.FC = () => {
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const chevronClassName = [
    styles.chevron ?? "",
    isToolsOpen === true ? (styles.chevronOpen ?? "") : "",
  ]
    .filter((value): value is string => value.length > 0)
    .join(" ");

  return (
    <div className={styles.overlayRoot}>
      {isToolsOpen === true ? (
        <Button
          color="teal"
          variant="solid"
          onClick={() => setIsToolsOpen((previous) => !previous)}
        >
          分解ツールを閉じる
          <ChevronDownIcon className={chevronClassName} />
        </Button>
      ) : (
        <IconButton
          aria-label="分解ツールを開く"
          className={styles.collapsedToggle}
          color="gray"
          onClick={() => setIsToolsOpen((previous) => !previous)}
          variant="surface"
        >
          <ChevronDownIcon className={chevronClassName} />
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
