import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import { Button, Menu, MenuItem } from "@mui/material";
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

export const ProjectActions: React.FC<ProjectActionsProps> = ({
  actions,
  onImport,
  importLabel = "復元",
}) => {
  const [menuAnchor, setMenuAnchor] = useState<O.Option<HTMLButtonElement>>(
    O.none,
  );

  const isMenuOpen = O.isSome(menuAnchor);

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
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={(event) => {
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
        anchorEl={O.isSome(menuAnchor) ? menuAnchor.value : document.body}
        open={isMenuOpen}
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
