import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Button from "@mui/material/Button";
import React from "react";
import {
  CHARACTER_DECOMPOSITION_OVERLAY_MENU_CLASS_NAME,
  CHARACTER_DECOMPOSITION_OVERLAY_ROOT_CLASS_NAME,
  CHARACTER_DECOMPOSITION_OVERLAY_TOGGLE_BUTTON_CLASS_NAME,
} from "../../../styleClassNames";
import { CharacterModeDecompositionToolCard } from "./CharacterModeDecompositionToolCard";

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

/**
 * 分解キャンバス上に重なるツールメニューを描画します。
 * ペン・消しゴム・切り取りとパレット操作をキャンバス近くに集約します。
 */
export const CharacterModeDecompositionToolOverlay: React.FC = () => {
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);

  return (
    <div className={CHARACTER_DECOMPOSITION_OVERLAY_ROOT_CLASS_NAME}>
      <Button
        className={CHARACTER_DECOMPOSITION_OVERLAY_TOGGLE_BUTTON_CLASS_NAME}
        type="button"
        variant={isToolsOpen ? "contained" : "outlined"}
        endIcon={<ExpandMoreRoundedIcon style={chevronStyle(isToolsOpen)} />}
        onClick={() => setIsToolsOpen((previous) => !previous)}
      >
        {isToolsOpen ? "分解ツールを閉じる" : "分解ツールを開く"}
      </Button>

      {isToolsOpen === true ? (
        <div className={CHARACTER_DECOMPOSITION_OVERLAY_MENU_CLASS_NAME}>
          <CharacterModeDecompositionToolCard />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
