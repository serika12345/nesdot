import React, { useEffect, useRef, useState } from "react";
import {
    ActionCluster,
    ActionMenu,
    ActionMenuButton,
    ActionMenuWrap,
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

export const ProjectActions: React.FC<ProjectActionsProps> = ({ actions, onImport, importLabel = "復元" }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <ActionCluster ref={rootRef}>
            <ActionMenuWrap>
                <IconActionButton
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

                {menuOpen && (
                    <ActionMenu role="menu" aria-label="共有メニュー">
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
                )}
            </ActionMenuWrap>

            <IconActionButton type="button" onClick={onImport}>
                <IconLabel>
                    <ImportIcon />
                    {importLabel}
                </IconLabel>
            </IconActionButton>
        </ActionCluster>
    );
};
