import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import { type SpriteModeToolOverlayState } from "../../../logic/spriteModeCanvasState";
import { SpriteModeToolMenu } from "../../menu/SpriteModeToolMenu";
import { chevronStyle, overlayRootStyle } from "./styles";

interface SpriteModeToolOverlayProps {
  toolOverlay: SpriteModeToolOverlayState;
}

/**
 * スプライトキャンバス上に重なるツールオーバーレイを描画します。
 * 描画ツール、クリア、並べ替え切り替えをキャンバス近くに集めて操作導線を短くする意図があります。
 */
export const SpriteModeToolOverlay: React.FC<SpriteModeToolOverlayProps> = ({
  toolOverlay,
}) => {
  return (
    <>
      <Box style={overlayRootStyle}>
        <Button
          type="button"
          variant={toolOverlay.isToolsOpen ? "contained" : "outlined"}
          endIcon={
            <ExpandMoreRoundedIcon
              style={chevronStyle(toolOverlay.isToolsOpen)}
            />
          }
          onClick={toolOverlay.handleToggleTools}
        >
          {toolOverlay.isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
        </Button>
      </Box>

      {toolOverlay.isToolsOpen === true ? (
        <SpriteModeToolMenu toolMenu={toolOverlay.toolMenu} />
      ) : (
        <></>
      )}
    </>
  );
};
