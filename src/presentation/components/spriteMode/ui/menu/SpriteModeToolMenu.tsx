import { Button } from "@radix-ui/themes";
import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { type SpriteModeToolMenuState } from "../../logic/spriteModeCanvasState";
import styles from "./SpriteModeToolMenu.module.css";

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
    <div className={styles.root}>
      <SurfaceCard className={styles.surface}>
        <div className={styles.actions}>
          <Button
            type="button"
            color={toolMenu.tool === "pen" ? "teal" : "gray"}
            disabled={toolMenu.isChangeOrderMode}
            variant={toolMenu.tool === "pen" ? "solid" : "surface"}
            onClick={() => toolMenu.handleToolChange("pen")}
          >
            ペン
          </Button>
          <Button
            type="button"
            color={toolMenu.tool === "eraser" ? "teal" : "gray"}
            disabled={toolMenu.isChangeOrderMode}
            variant={toolMenu.tool === "eraser" ? "solid" : "surface"}
            onClick={() => toolMenu.handleToolChange("eraser")}
          >
            消しゴム
          </Button>
          <Button
            type="button"
            color="gray"
            disabled={toolMenu.isChangeOrderMode}
            variant="surface"
            onClick={toolMenu.handleClearSprite}
          >
            クリア
          </Button>
          <Button
            type="button"
            color={toolMenu.isChangeOrderMode === true ? "teal" : "gray"}
            variant={toolMenu.isChangeOrderMode === true ? "solid" : "surface"}
            onClick={toolMenu.handleToggleChangeOrderMode}
          >
            {toolMenu.isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
};
