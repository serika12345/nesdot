import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Button } from "@radix-ui/themes";
import React from "react";
import { type SpriteModeToolOverlayState } from "../../logic/spriteModeCanvasState";
import { SpriteModeToolMenu } from "../menu/SpriteModeToolMenu";
import styles from "./SpriteModeToolOverlay.module.css";

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
      <div className={styles.root}>
        <Button
          type="button"
          color={toolOverlay.isToolsOpen === true ? "teal" : "gray"}
          variant={toolOverlay.isToolsOpen === true ? "solid" : "surface"}
          onClick={toolOverlay.handleToggleTools}
        >
          {toolOverlay.isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
          <ExpandMoreRoundedIcon
            className={styles.chevron}
            data-open={toolOverlay.isToolsOpen}
          />
        </Button>
      </div>

      {toolOverlay.isToolsOpen === true ? (
        <SpriteModeToolMenu toolMenu={toolOverlay.toolMenu} />
      ) : (
        <></>
      )}
    </>
  );
};
