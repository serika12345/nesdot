import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type ScreenModeContextMenuStateResult } from "../../logic/useScreenModeContextMenuState";
import { resolveMenuPosition } from "./ScreenModeGestureWorkspaceShared";
import styles from "./ScreenModeGestureContextMenu.module.css";

interface ScreenModeGestureContextMenuProps {
  contextMenuState: ScreenModeContextMenuStateResult;
}

export const ScreenModeGestureContextMenu: React.FC<
  ScreenModeGestureContextMenuProps
> = ({ contextMenuState }) => {
  const contextMenuPosition = pipe(
    contextMenuState.menu,
    O.map((menu) => resolveMenuPosition(menu.clientX, menu.clientY)),
  );

  if (O.isNone(contextMenuPosition)) {
    return <></>;
  }

  return (
    <div
      aria-label="スクリーン配置コンテキストメニュー"
      className={styles.menu}
      data-screen-context-menu="true"
      role="menu"
      style={{
        left: contextMenuPosition.value.left,
        top: contextMenuPosition.value.top,
      }}
    >
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleRaiseLayer}
      >
        レイヤーを上げる
      </button>
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleLowerLayer}
      >
        レイヤーを下げる
      </button>
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleSetPriorityFront}
      >
        優先度: 背景の前
      </button>
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleSetPriorityBehind}
      >
        優先度: 背景の後ろ
      </button>
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleToggleFlipH}
      >
        H反転
      </button>
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleToggleFlipV}
      >
        V反転
      </button>
      <button
        className={styles.item}
        role="menuitem"
        type="button"
        onClick={contextMenuState.handleDeleteSprites}
      >
        削除
      </button>
    </div>
  );
};
