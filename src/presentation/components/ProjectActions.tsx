import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { styled } from "@mui/material/styles";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ActionButtonsRow,
  ActionCluster,
  ActionMenu,
  ActionMenuButton,
  ActionMenuOverlay,
  IconActionButton,
  IconLabel,
} from "../App.styles";
import { ChevronIcon, ImportIcon, ShareIcon } from "./ui/Icons";

type ActionItem = {
  label: string;
  onSelect: () => void;
};

type ProjectActionsProps = {
  actions: ActionItem[];
  onImport?: () => void;
  importLabel?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  ready: boolean;
};

type PositionedActionMenuProps = {
  menuTop: number;
  menuLeft: number;
  menuWidth: number;
  ready: boolean;
};

const shouldForwardMenuProp = (prop: PropertyKey): boolean =>
  prop !== "menuTop" &&
  prop !== "menuLeft" &&
  prop !== "menuWidth" &&
  prop !== "ready";

const PositionedActionMenu = styled(ActionMenu, {
  shouldForwardProp: shouldForwardMenuProp,
})<PositionedActionMenuProps>(
  ({ menuLeft, menuTop, menuWidth, ready }) => ({
    top: menuTop,
    left: menuLeft,
    width: menuWidth,
    visibility: ready ? "visible" : "hidden",
  }),
);

export const ProjectActions: React.FC<ProjectActionsProps> = ({
  actions,
  onImport,
  importLabel = "復元",
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 220,
    ready: false,
  });
  const triggerRef = useRef<O.Option<HTMLButtonElement>>(O.none);
  const menuRef = useRef<O.Option<HTMLDivElement>>(O.none);

  const updateMenuPosition = useCallback(() => {
    if (O.isNone(triggerRef.current)) return;

    const viewportPadding = 16;
    const triggerRect = triggerRef.current.value.getBoundingClientRect();
    const menuWidth = pipe(
      menuRef.current,
      O.map((node) => node.offsetWidth),
      O.getOrElse(() => 220),
    );
    const menuHeight = pipe(
      menuRef.current,
      O.map((node) => node.offsetHeight),
      O.getOrElse(() => 0),
    );
    const measuredWidth = Math.max(triggerRect.width, menuWidth);
    const width = Math.min(
      measuredWidth,
      window.innerWidth - viewportPadding * 2,
    );
    const measuredHeight = menuHeight;

    const left = Math.max(
      viewportPadding,
      Math.min(
        triggerRect.right - width,
        window.innerWidth - width - viewportPadding,
      ),
    );

    const belowTop = triggerRect.bottom + 10;
    const top =
      measuredHeight > 0 &&
      belowTop + measuredHeight > window.innerHeight - viewportPadding
        ? (() => {
            const topAbove = triggerRect.top - measuredHeight - 10;
            return topAbove >= viewportPadding
              ? topAbove
              : Math.max(
                  viewportPadding,
                  window.innerHeight - measuredHeight - viewportPadding,
                );
          })()
        : belowTop;

    setMenuPosition({
      top,
      left,
      width,
      ready: true,
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (menuOpen === false) return;
    updateMenuPosition();
  }, [menuOpen, updateMenuPosition]);

  useEffect(() => {
    if (menuOpen === false) return;

    const reposition = () => updateMenuPosition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [menuOpen, updateMenuPosition]);

  useEffect(() => {
    if (menuOpen === false) {
      setMenuPosition((prev) => ({ ...prev, ready: false }));
    }
  }, [menuOpen]);

  const menu = menuOpen
    ? O.some(
        createPortal(
          <ActionMenuOverlay onPointerDown={() => setMenuOpen(false)}>
            <PositionedActionMenu
              ref={(node) => {
                menuRef.current = O.fromNullable(node);
              }}
              role="menu"
              aria-label="共有メニュー"
              onPointerDown={(event) => event.stopPropagation()}
              menuTop={menuPosition.top}
              menuLeft={menuPosition.left}
              menuWidth={menuPosition.width}
              ready={menuPosition.ready}
            >
              {actions.map((action) => (
                <ActionMenuButton
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    action.onSelect();
                  }}
                >
                  <span>{action.label}</span>
                  <ShareIcon size={14} />
                </ActionMenuButton>
              ))}
            </PositionedActionMenu>
          </ActionMenuOverlay>,
          document.body,
        ),
      )
    : O.none;

  return (
    <>
      <ActionCluster>
        <ActionButtonsRow>
          <IconActionButton
            ref={(node) => {
              triggerRef.current = O.fromNullable(node);
            }}
            type="button"
            active={menuOpen}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <IconLabel>
              <ShareIcon />
              共有
            </IconLabel>
            <ChevronIcon open={menuOpen} />
          </IconActionButton>

          {typeof onImport === "function" && (
            <IconActionButton type="button" onClick={onImport}>
              <IconLabel>
                <ImportIcon />
                {importLabel}
              </IconLabel>
            </IconActionButton>
          )}
        </ActionButtonsRow>
      </ActionCluster>

      {O.isSome(menu) ? menu.value : false}
    </>
  );
};
