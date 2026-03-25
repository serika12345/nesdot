import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ActionButtonsRow,
    ActionCluster,
    ActionMenu,
    ActionMenuOverlay,
    ActionMenuButton,
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
    onImport: () => void;
    importLabel?: string;
};

type MenuPosition = {
    top: number;
    left: number;
    width: number;
    ready: boolean;
};

export const ProjectActions: React.FC<ProjectActionsProps> = ({ actions, onImport, importLabel = "復元" }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<MenuPosition>({
        top: 0,
        left: 0,
        width: 220,
        ready: false,
    });
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const viewportPadding = 16;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const measuredWidth = Math.max(triggerRect.width, menuRef.current?.offsetWidth ?? 220);
        const width = Math.min(measuredWidth, window.innerWidth - viewportPadding * 2);
        const measuredHeight = menuRef.current?.offsetHeight ?? 0;

        let left = triggerRect.right - width;
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));

        let top = triggerRect.bottom + 10;
        if (measuredHeight > 0 && top + measuredHeight > window.innerHeight - viewportPadding) {
            const topAbove = triggerRect.top - measuredHeight - 10;
            top = topAbove >= viewportPadding ? topAbove : Math.max(viewportPadding, window.innerHeight - measuredHeight - viewportPadding);
        }

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
        if (!menuOpen) return;
        updateMenuPosition();
    }, [menuOpen, updateMenuPosition]);

    useEffect(() => {
        if (!menuOpen) return;

        const reposition = () => updateMenuPosition();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);

        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [menuOpen, updateMenuPosition]);

    useEffect(() => {
        if (!menuOpen) {
            setMenuPosition((prev) => ({ ...prev, ready: false }));
        }
    }, [menuOpen]);

    const menu =
        menuOpen && typeof document !== "undefined"
            ? createPortal(
                  <ActionMenuOverlay onPointerDown={() => setMenuOpen(false)}>
                      <ActionMenu
                          ref={menuRef}
                          role="menu"
                          aria-label="共有メニュー"
                          onPointerDown={(event) => event.stopPropagation()}
                          style={{
                              top: menuPosition.top,
                              left: menuPosition.left,
                              width: menuPosition.width,
                              visibility: menuPosition.ready ? "visible" : "hidden",
                          }}
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
                      </ActionMenu>
                  </ActionMenuOverlay>,
                  document.body
              )
            : null;

    return (
        <>
            <ActionCluster>
                <ActionButtonsRow>
                    <IconActionButton
                        ref={triggerRef}
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

                    <IconActionButton type="button" onClick={onImport}>
                        <IconLabel>
                            <ImportIcon />
                            {importLabel}
                        </IconLabel>
                    </IconActionButton>
                </ActionButtonsRow>
            </ActionCluster>

            {menu}
        </>
    );
};
