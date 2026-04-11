import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import * as O from "fp-ts/Option";
import React, { useState } from "react";

type ActionItem = {
  label: string;
  onSelect: () => void;
};

type ProjectActionsProps = {
  actions: ActionItem[];
  onImport?: () => void;
  importLabel?: string;
};

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

/**
 * 共有・保存・復元系のプロジェクト操作をまとめて表示するメニューです。
 * 各画面が action 配列だけ渡せば同じ UI で export/import 導線を再利用できるようにします。
 */
export const ProjectActions: React.FC<ProjectActionsProps> = ({
  actions,
  onImport,
  importLabel = "復元",
}) => {
  const [menuAnchor, setMenuAnchor] = useState<O.Option<HTMLButtonElement>>(
    O.none,
  );

  const isMenuOpen = O.isSome(menuAnchor);
  const hasActions = actions.length > 0;

  const closeMenu = (): void => {
    setMenuAnchor(O.none);
  };

  return (
    <>
      <Button
        type="button"
        variant={isMenuOpen ? "contained" : "outlined"}
        startIcon={<IosShareRoundedIcon />}
        endIcon={<ExpandMoreRoundedIcon style={chevronStyle(isMenuOpen)} />}
        disabled={hasActions === false}
        aria-expanded={isMenuOpen}
        {...(hasActions === true ? { "aria-haspopup": "menu" } : {})}
        onClick={(event) => {
          if (hasActions === false) {
            return;
          }

          setMenuAnchor(O.some(event.currentTarget));
        }}
      >
        共有
      </Button>

      {typeof onImport === "function" && (
        <Button
          type="button"
          variant="outlined"
          startIcon={<RestoreRoundedIcon />}
          onClick={onImport}
        >
          {importLabel}
        </Button>
      )}

      <Menu
        anchorEl={
          hasActions === true && O.isSome(menuAnchor)
            ? menuAnchor.value
            : document.body
        }
        open={hasActions === true && isMenuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.label}
            onClick={() => {
              closeMenu();
              action.onSelect();
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
