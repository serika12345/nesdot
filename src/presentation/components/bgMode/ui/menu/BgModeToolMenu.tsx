import { Button } from "@radix-ui/themes";
import React from "react";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import styles from "../../../common/ui/overlay/CanvasToolMenu.module.css";

type BgModeTool = "pen" | "eraser";

interface BgModeToolMenuProps {
  id?: string;
  tool: BgModeTool;
  onToolChange: (nextTool: BgModeTool) => void;
}

/**
 * BG editor の描画ツール切り替えメニューです。
 */
export const BgModeToolMenu: React.FC<BgModeToolMenuProps> = ({
  id,
  tool,
  onToolChange,
}) => {
  return (
    <section className={styles.root} id={id} aria-label="BG編集ツールメニュー">
      <SurfaceCard className={styles.surface}>
        <div className={styles.actions} role="toolbar" aria-label="描画ツール">
          <Button
            type="button"
            aria-label="ペンツール"
            aria-pressed={tool === "pen"}
            color={tool === "pen" ? "teal" : "gray"}
            variant={tool === "pen" ? "solid" : "surface"}
            onClick={() => onToolChange("pen")}
          >
            ペン
          </Button>
          <Button
            type="button"
            aria-label="消しゴムツール"
            aria-pressed={tool === "eraser"}
            color={tool === "eraser" ? "teal" : "gray"}
            variant={tool === "eraser" ? "solid" : "surface"}
            onClick={() => onToolChange("eraser")}
          >
            消しゴム
          </Button>
        </div>
      </SurfaceCard>
    </section>
  );
};
