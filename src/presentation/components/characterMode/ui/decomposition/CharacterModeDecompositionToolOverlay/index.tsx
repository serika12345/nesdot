import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { CharacterModeDecompositionToolCard } from "../CharacterModeDecompositionToolCard";
import {
  chevronStyle,
  overlayCollapsedToggleButtonStyle,
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
      {isToolsOpen === true ? (
        <Button
          type="button"
          variant="contained"
          style={overlayToggleButtonStyle}
          endIcon={<ExpandMoreRoundedIcon style={chevronStyle(true)} />}
          onClick={() => setIsToolsOpen((previous) => !previous)}
        >
          分解ツールを閉じる
        </Button>
      ) : (
        <IconButton
          type="button"
          aria-label="分解ツールを開く"
          style={overlayCollapsedToggleButtonStyle}
          onClick={() => setIsToolsOpen((previous) => !previous)}
        >
          <ExpandMoreRoundedIcon style={chevronStyle(false)} />
        </IconButton>
      )}

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
