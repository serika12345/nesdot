import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type ScreenModeContextMenuStateResult } from "../../logic/useScreenModeContextMenuState";
import { resolveMenuPosition } from "./ScreenModeGestureWorkspaceShared";

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

  return (
    <Menu
      open={O.isSome(contextMenuPosition)}
      onClose={contextMenuState.close}
      anchorReference="anchorPosition"
      anchorPosition={pipe(
        contextMenuPosition,
        O.getOrElse(() => ({ left: 0, top: 0 })),
      )}
      MenuListProps={{
        "aria-label": "スクリーン配置コンテキストメニュー",
      }}
    >
      <MenuItem onClick={contextMenuState.handleRaiseLayer}>
        レイヤーを上げる
      </MenuItem>
      <MenuItem onClick={contextMenuState.handleLowerLayer}>
        レイヤーを下げる
      </MenuItem>
      <MenuItem onClick={contextMenuState.handleSetPriorityFront}>
        優先度: 背景の前
      </MenuItem>
      <MenuItem onClick={contextMenuState.handleSetPriorityBehind}>
        優先度: 背景の後ろ
      </MenuItem>
      <MenuItem onClick={contextMenuState.handleToggleFlipH}>H反転</MenuItem>
      <MenuItem onClick={contextMenuState.handleToggleFlipV}>V反転</MenuItem>
      <MenuItem onClick={contextMenuState.handleDeleteSprites}>削除</MenuItem>
    </Menu>
  );
};
