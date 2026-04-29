import { Button } from "@radix-ui/themes";
import React from "react";
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
  const chevronClassName = [
    styles.chevron ?? "",
    toggleState.isOpen === true ? (styles.chevronOpen ?? "") : "",
  ]
    .filter((value): value is string => value.length > 0)
    .join(" ");

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
          <ChevronDownIcon className={chevronClassName} />
        </Button>
      </div>

      {toggleState.isOpen === true ? menu : <></>}
    </>
  );
};
