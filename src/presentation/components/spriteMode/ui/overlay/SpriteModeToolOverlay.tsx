import React from "react";
import { CanvasToolOverlay } from "../../../common/ui/overlay/CanvasToolOverlay";
import { type SpriteModeToolOverlayState } from "../../logic/spriteModeCanvasState";
import { SpriteModeToolMenu } from "../menu/SpriteModeToolMenu";

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
    <CanvasToolOverlay
      controlsId="sprite-mode-canvas-tool-menu"
      labels={{
        close: "ツールを閉じる",
        open: "ツールを開く",
      }}
      toggleState={{
        isOpen: toolOverlay.isToolsOpen,
        onToggle: toolOverlay.handleToggleTools,
      }}
      menu={
        <SpriteModeToolMenu
          id="sprite-mode-canvas-tool-menu"
          toolMenu={toolOverlay.toolMenu}
        />
      }
    />
  );
};
