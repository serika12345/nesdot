import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import { CharacterModeDecompositionToolCard } from "../CharacterModeDecompositionToolCard";
import {
  chevronStyle,
  overlayMenuProps,
  overlayRootProps,
  overlayToggleButtonStyle,
} from "./styles";

/**
 * 分解キャンバス上に重なるツールメニューを描画します。
 * ペン・消しゴム・切り取りとパレット操作をキャンバス近くに集約します。
 */
export const CharacterModeDecompositionToolOverlay: React.FC = () => {
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);

  return (
    <Box {...overlayRootProps}>
      <Button
        type="button"
        variant={isToolsOpen ? "contained" : "outlined"}
        style={overlayToggleButtonStyle}
        endIcon={<ExpandMoreRoundedIcon style={chevronStyle(isToolsOpen)} />}
        onClick={() => setIsToolsOpen((previous) => !previous)}
      >
        {isToolsOpen ? "分解ツールを閉じる" : "分解ツールを開く"}
      </Button>

      {isToolsOpen === true ? (
        <Box {...overlayMenuProps}>
          <CharacterModeDecompositionToolCard />
        </Box>
      ) : (
        <></>
      )}
    </Box>
  );
};
