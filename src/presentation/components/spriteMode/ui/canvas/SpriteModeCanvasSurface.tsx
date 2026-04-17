import Stack from "@mui/material/Stack";
import React from "react";
import { useSpriteCanvas } from "../../../../../infrastructure/browser/canvas/useSpriteCanvas";
import { APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME } from "../../../../styleClassNames";
import { type SpriteModeCanvasSurfaceState } from "../../logic/spriteModeCanvasState";

interface SpriteModeCanvasSurfaceProps {
  canvasSurface: SpriteModeCanvasSurfaceState;
}

/**
 * スプライト編集用 canvas 本体です。
 * spriteMode 専用の編集状態を受け取り、canvas フックへ接続します。
 */
export const SpriteModeCanvasSurface: React.FC<
  SpriteModeCanvasSurfaceProps
> = ({ canvasSurface }) => {
  const { canvasProps } = useSpriteCanvas({
    display: {
      scale: 24,
      showGrid: true,
      target: canvasSurface.activeSprite,
    },
    interaction: {
      activeColorIndex: canvasSurface.activeSlot,
      currentSelectPalette: canvasSurface.activePalette,
      isChangeOrderMode: canvasSurface.isChangeOrderMode,
      onChange: canvasSurface.handleTileChange,
      tool: canvasSurface.tool,
    },
  });

  return (
    <Stack
      minWidth="100%"
      minHeight="100%"
      alignItems="center"
      justifyContent="center"
    >
      <canvas
        className={APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME}
        aria-label="スプライト編集キャンバス"
        {...canvasProps}
      />
    </Stack>
  );
};
