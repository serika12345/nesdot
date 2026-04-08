import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { createPortal } from "react-dom";
import {
  PortalOverlay,
  PositionedActionMenu,
  PositionedActionMenuButton,
} from "../primitives/CharacterModePrimitives";
import {
  useCharacterModeDecompositionRegionMenuActions,
  useCharacterModeDecompositionRegionMenuState,
} from "../core/CharacterModeStateProvider";
import {
  DECOMPOSITION_REGION_CONTEXT_MENU_HEIGHT,
  DECOMPOSITION_REGION_CONTEXT_MENU_WIDTH,
} from "../hooks/useCharacterModeState";

/**
 * 分解ステージ上の切り取り領域用コンテキストメニューです。
 */
export const CharacterModeDecompositionRegionMenu: React.FC = () => {
  const menuState = useCharacterModeDecompositionRegionMenuState();
  const menuActions = useCharacterModeDecompositionRegionMenuActions();

  const portal =
    typeof document === "undefined"
      ? O.none
      : pipe(
          menuState.decompositionRegionContextMenu,
          O.map((menu) => {
            const viewportWidth =
              typeof window === "undefined" ? menu.clientX : window.innerWidth;
            const viewportHeight =
              typeof window === "undefined" ? menu.clientY : window.innerHeight;
            const left = Math.max(
              12,
              Math.min(
                menu.clientX,
                viewportWidth - DECOMPOSITION_REGION_CONTEXT_MENU_WIDTH - 12,
              ),
            );
            const top = Math.max(
              12,
              Math.min(
                menu.clientY,
                viewportHeight - DECOMPOSITION_REGION_CONTEXT_MENU_HEIGHT - 12,
              ),
            );

            return createPortal(
              <PortalOverlay
                data-decomposition-region-context-menu-root="true"
                onContextMenu={(event) => event.preventDefault()}
                onPointerDown={menuState.closeDecompositionRegionContextMenu}
              >
                <PositionedActionMenu
                  role="menu"
                  aria-label="切り取り領域メニュー"
                  onPointerDown={(event) => event.stopPropagation()}
                  menuLeft={left}
                  menuTop={top}
                  menuWidth={DECOMPOSITION_REGION_CONTEXT_MENU_WIDTH}
                  ready={true}
                >
                  <PositionedActionMenuButton
                    type="button"
                    danger
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      menuActions.handleDeleteContextMenuRegion(menu.regionId);
                      menuActions.focusStageElement();
                    }}
                  >
                    選択中領域を削除
                  </PositionedActionMenuButton>
                </PositionedActionMenu>
              </PortalOverlay>,
              document.body,
            );
          }),
        );

  return pipe(
    portal,
    O.match(
      () => <></>,
      (menu) => menu,
    ),
  );
};
