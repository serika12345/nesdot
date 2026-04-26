import { Button } from "@radix-ui/themes";
import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import styles from "../../../common/ui/overlay/CanvasToolMenu.module.css";
import { type SpriteModeToolMenuState } from "../../logic/spriteModeCanvasState";

interface SpriteModeToolMenuProps {
  id?: string;
  toolMenu: SpriteModeToolMenuState;
}

/**
 * スプライトキャンバスのツールメニューです。
 */
export const SpriteModeToolMenu: React.FC<SpriteModeToolMenuProps> = ({
  id,
  toolMenu,
}) => {
  return (
    <section
      className={styles.root}
      id={id}
      aria-label="スプライト編集ツールメニュー"
    >
      <SurfaceCard className={styles.surface}>
        <div className={styles.actions} role="toolbar" aria-label="描画ツール">
          <Button
            type="button"
            aria-label="ペンツール"
            aria-pressed={toolMenu.tool === "pen"}
            color={toolMenu.tool === "pen" ? "teal" : "gray"}
            disabled={toolMenu.isChangeOrderMode}
            variant={toolMenu.tool === "pen" ? "solid" : "surface"}
            onClick={() => toolMenu.handleToolChange("pen")}
          >
            ペン
          </Button>
          <Button
            type="button"
            aria-label="消しゴムツール"
            aria-pressed={toolMenu.tool === "eraser"}
            color={toolMenu.tool === "eraser" ? "teal" : "gray"}
            disabled={toolMenu.isChangeOrderMode}
            variant={toolMenu.tool === "eraser" ? "solid" : "surface"}
            onClick={() => toolMenu.handleToolChange("eraser")}
          >
            消しゴム
          </Button>
          <Button
            type="button"
            aria-label="スプライトをクリア"
            color="gray"
            disabled={toolMenu.isChangeOrderMode}
            variant="surface"
            onClick={toolMenu.handleClearSprite}
          >
            クリア
          </Button>
          <Button
            type="button"
            aria-label={
              toolMenu.isChangeOrderMode ? "並べ替え終了" : "並べ替え"
            }
            aria-pressed={toolMenu.isChangeOrderMode}
            color={toolMenu.isChangeOrderMode === true ? "teal" : "gray"}
            variant={toolMenu.isChangeOrderMode === true ? "solid" : "surface"}
            onClick={toolMenu.handleToggleChangeOrderMode}
          >
            {toolMenu.isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
          </Button>
        </div>
      </SurfaceCard>
    </section>
  );
};
