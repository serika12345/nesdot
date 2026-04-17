import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import { type SpriteModeToolMenuState } from "../../logic/spriteModeCanvasState";
import {
  toolMenuPaperStyle,
  toolMenuRootStyle,
} from "./SpriteModeToolMenuStyle";

interface SpriteModeToolMenuProps {
  toolMenu: SpriteModeToolMenuState;
}

/**
 * スプライトキャンバスのツールメニューです。
 */
export const SpriteModeToolMenu: React.FC<SpriteModeToolMenuProps> = ({
  toolMenu,
}) => {
  return (
    <Box style={toolMenuRootStyle}>
      <Paper variant="outlined" style={toolMenuPaperStyle}>
        <Stack spacing={1}>
          <Button
            type="button"
            variant={toolMenu.tool === "pen" ? "contained" : "outlined"}
            disabled={toolMenu.isChangeOrderMode}
            onClick={() => toolMenu.handleToolChange("pen")}
          >
            ペン
          </Button>
          <Button
            type="button"
            variant={toolMenu.tool === "eraser" ? "contained" : "outlined"}
            disabled={toolMenu.isChangeOrderMode}
            onClick={() => toolMenu.handleToolChange("eraser")}
          >
            消しゴム
          </Button>
          <Button
            type="button"
            variant="outlined"
            disabled={toolMenu.isChangeOrderMode}
            onClick={toolMenu.handleClearSprite}
          >
            クリア
          </Button>
          <Button
            type="button"
            variant={toolMenu.isChangeOrderMode ? "contained" : "outlined"}
            color={toolMenu.isChangeOrderMode ? "primary" : "inherit"}
            onClick={toolMenu.handleToggleChangeOrderMode}
          >
            {toolMenu.isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
