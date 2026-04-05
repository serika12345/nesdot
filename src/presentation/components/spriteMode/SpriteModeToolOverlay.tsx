import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Button } from "@mui/material";
import React from "react";
import { useSpriteModeToolsVisibility } from "./SpriteModeStateProvider";
import { SpriteModeToolMenu } from "./SpriteModeToolMenu";

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

/**
 * スプライトキャンバス上に重なるツールオーバーレイを描画します。
 * 描画ツール、クリア、並べ替え切り替えをキャンバス近くに集めて操作導線を短くする意図があります。
 */
export const SpriteModeToolOverlay: React.FC = () => {
  const toolsVisibility = useSpriteModeToolsVisibility();

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
          variant={toolsVisibility.isToolsOpen ? "contained" : "outlined"}
          endIcon={
            <ExpandMoreRoundedIcon
              style={chevronStyle(toolsVisibility.isToolsOpen)}
            />
          }
          onClick={toolsVisibility.handleToggleTools}
        >
          {toolsVisibility.isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
        </Button>
      </Box>

      {toolsVisibility.isToolsOpen === true && <SpriteModeToolMenu />}
    </>
  );
};
