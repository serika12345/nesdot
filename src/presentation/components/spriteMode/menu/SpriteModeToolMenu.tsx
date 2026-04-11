import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import React from "react";
import {
  useSpriteModeChangeOrder,
  useSpriteModeToolActions,
} from "../core/SpriteModeStateProvider";

/**
 * スプライトキャンバスのツールメニューです。
 */
export const SpriteModeToolMenu: React.FC = () => {
  const toolActions = useSpriteModeToolActions();
  const changeOrder = useSpriteModeChangeOrder();

  return (
    <Box
      style={{
        position: "absolute",
        top: "4.25rem",
        left: "1.125rem",
        zIndex: 3,
        bottom: "1.125rem",
        pointerEvents: "none",
      }}
    >
      <Paper
        variant="outlined"
        style={{
          pointerEvents: "auto",
          padding: "0.75rem",
          width: "8.5rem",
        }}
      >
        <Stack spacing={1}>
          <Button
            type="button"
            variant={toolActions.tool === "pen" ? "contained" : "outlined"}
            disabled={changeOrder.isChangeOrderMode}
            onClick={() => toolActions.handleToolChange("pen")}
          >
            ペン
          </Button>
          <Button
            type="button"
            variant={toolActions.tool === "eraser" ? "contained" : "outlined"}
            disabled={changeOrder.isChangeOrderMode}
            onClick={() => toolActions.handleToolChange("eraser")}
          >
            消しゴム
          </Button>
          <Button
            type="button"
            variant="outlined"
            disabled={changeOrder.isChangeOrderMode}
            onClick={toolActions.handleClearSprite}
          >
            クリア
          </Button>
          <Button
            type="button"
            variant={changeOrder.isChangeOrderMode ? "contained" : "outlined"}
            color={changeOrder.isChangeOrderMode ? "primary" : "inherit"}
            onClick={changeOrder.handleToggleChangeOrderMode}
          >
            {changeOrder.isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
