import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Button, Paper, Stack } from "@mui/material";
import React from "react";
import { Tool } from "../../../infrastructure/browser/canvas/useSpriteCanvas";

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

interface SpriteModeToolOverlayProps {
  isToolsOpen: boolean;
  isChangeOrderMode: boolean;
  tool: Tool;
  onToggleTools: () => void;
  onSetTool: (tool: Tool) => void;
  onClearSprite: () => void | Promise<void>;
  onToggleChangeOrderMode: () => void;
}

export const SpriteModeToolOverlay: React.FC<SpriteModeToolOverlayProps> = ({
  isToolsOpen,
  isChangeOrderMode,
  tool,
  onToggleTools,
  onSetTool,
  onClearSprite,
  onToggleChangeOrderMode,
}) => {
  return (
    <>
      <Box
        style={{
          position: "absolute",
          top: "1.125rem",
          left: "1.125rem",
          zIndex: 4,
        }}
      >
        <Button
          type="button"
          variant={isToolsOpen ? "contained" : "outlined"}
          endIcon={<ExpandMoreRoundedIcon style={chevronStyle(isToolsOpen)} />}
          onClick={onToggleTools}
        >
          {isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
        </Button>
      </Box>

      {isToolsOpen && (
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
                variant={tool === "pen" ? "contained" : "outlined"}
                disabled={isChangeOrderMode}
                onClick={() => onSetTool("pen")}
              >
                ペン
              </Button>
              <Button
                type="button"
                variant={tool === "eraser" ? "contained" : "outlined"}
                disabled={isChangeOrderMode}
                onClick={() => onSetTool("eraser")}
              >
                消しゴム
              </Button>
              <Button
                type="button"
                variant="outlined"
                disabled={isChangeOrderMode}
                onClick={onClearSprite}
              >
                クリア
              </Button>
              <Button
                type="button"
                variant={isChangeOrderMode ? "contained" : "outlined"}
                color={isChangeOrderMode ? "primary" : "inherit"}
                onClick={onToggleChangeOrderMode}
              >
                {isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </>
  );
};
