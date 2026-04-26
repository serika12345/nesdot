import { Button } from "@radix-ui/themes";
import React from "react";
import { mergeClassNames } from "../../../../styleClassNames";
import { ChevronDownIcon } from "../icons/AppIcons";
import styles from "./CanvasToolOverlay.module.css";

interface CanvasToolToggleState {
  isOpen: boolean;
  onToggle: () => void;
}

interface CanvasToolOverlayProps {
  controlsId: string;
  labels: Readonly<{
    close: string;
    open: string;
  }>;
  menu: React.ReactNode;
  toggleState: CanvasToolToggleState;
}

/**
 * キャンバス上のツールメニューを開閉する共通オーバーレイです。
 */
export const CanvasToolOverlay: React.FC<CanvasToolOverlayProps> = ({
  controlsId,
  labels,
  menu,
  toggleState,
}) => {
  return (
    <>
      <div className={styles.root}>
        <Button
          type="button"
          aria-expanded={toggleState.isOpen}
          aria-controls={controlsId}
          aria-label={toggleState.isOpen === true ? labels.close : labels.open}
          color={toggleState.isOpen === true ? "teal" : "gray"}
          variant={toggleState.isOpen === true ? "solid" : "surface"}
          onClick={toggleState.onToggle}
        >
          {toggleState.isOpen === true ? labels.close : labels.open}
          <ChevronDownIcon
            className={mergeClassNames(
              styles.chevron ?? "",
              toggleState.isOpen === true ? (styles.chevronOpen ?? "") : false,
            )}
          />
        </Button>
      </div>

      {toggleState.isOpen === true ? menu : <></>}
    </>
  );
};
