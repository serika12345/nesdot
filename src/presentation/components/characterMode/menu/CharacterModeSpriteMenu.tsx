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
  useCharacterModeSpriteMenuActions,
  useCharacterModeSpriteMenuState,
} from "../core/CharacterModeStateProvider";
import {
  STAGE_CONTEXT_MENU_HEIGHT,
  STAGE_CONTEXT_MENU_WIDTH,
} from "../hooks/useCharacterModeState";

/**
 * 合成ステージ上のスプライト用コンテキストメニューです。
 */
export const CharacterModeSpriteMenu: React.FC = () => {
  const menuState = useCharacterModeSpriteMenuState();
  const menuActions = useCharacterModeSpriteMenuActions();

  const portal =
    typeof document === "undefined"
      ? O.none
      : pipe(
          menuState.spriteContextMenu,
          O.map((menu) => {
            const viewportWidth =
              typeof window === "undefined" ? menu.clientX : window.innerWidth;
            const viewportHeight =
              typeof window === "undefined" ? menu.clientY : window.innerHeight;
            const left = Math.max(
              12,
              Math.min(menu.clientX, viewportWidth - STAGE_CONTEXT_MENU_WIDTH - 12),
            );
            const top = Math.max(
              12,
              Math.min(
                menu.clientY,
                viewportHeight - STAGE_CONTEXT_MENU_HEIGHT - 12,
              ),
            );
            const actions: ReadonlyArray<{
              label: string;
              onSelect: () => void;
              tone?: "default" | "danger";
            }> = [
              {
                label: "レイヤーを上げる",
                onSelect: () =>
                  menuActions.handleShiftContextMenuSpriteLayer(
                    menu.spriteEditorIndex,
                    1,
                  ),
              },
              {
                label: "レイヤーを下げる",
                onSelect: () =>
                  menuActions.handleShiftContextMenuSpriteLayer(
                    menu.spriteEditorIndex,
                    -1,
                  ),
              },
              {
                label: "削除",
                onSelect: () =>
                  menuActions.handleDeleteContextMenuSprite(
                    menu.spriteEditorIndex,
                  ),
                tone: "danger",
              },
            ];

            return createPortal(
              <PortalOverlay
                data-sprite-context-menu-root="true"
                onContextMenu={menuState.handleComposeContextMenu}
                onPointerDown={menuState.closeSpriteContextMenu}
              >
                <PositionedActionMenu
                  role="menu"
                  aria-label="スプライトメニュー"
                  onPointerDown={(event) => event.stopPropagation()}
                  menuLeft={left}
                  menuTop={top}
                  menuWidth={STAGE_CONTEXT_MENU_WIDTH}
                  ready={true}
                >
                  {actions.map((action) => (
                    <PositionedActionMenuButton
                      key={action.label}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        action.onSelect();
                        menuActions.focusStageElement();
                      }}
                      danger={action.tone === "danger"}
                    >
                      {action.label}
                    </PositionedActionMenuButton>
                  ))}
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
