import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import { useSpriteModeToolsVisibility } from "../../core/SpriteModeStateProvider";
import { SpriteModeToolMenu } from "../../menu/SpriteModeToolMenu";
import { chevronStyle, overlayRootStyle } from "./styles";

/**
 * スプライトキャンバス上に重なるツールオーバーレイを描画します。
 * 描画ツール、クリア、並べ替え切り替えをキャンバス近くに集めて操作導線を短くする意図があります。
 */
export const SpriteModeToolOverlay: React.FC = () => {
  const toolsVisibility = useSpriteModeToolsVisibility();

  return (
    <>
      <Box style={overlayRootStyle}>
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
