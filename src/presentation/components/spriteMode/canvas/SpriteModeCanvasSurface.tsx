import Stack from "@mui/material/Stack";
import React from "react";
import { useSpriteCanvas } from "../../../../infrastructure/browser/canvas/useSpriteCanvas";
import { APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME } from "../../../styleClassNames";
import {
  useSpriteModeCanvasPaint,
  useSpriteModeCanvasTarget,
  useSpriteModeChangeOrder,
} from "../core/SpriteModeStateProvider";

/**
 * スプライト編集用 canvas 本体です。
 * SpriteMode 専用 context から編集状態を読み取り、canvas フックへ接続します。
 */
export const SpriteModeCanvasSurface: React.FC = () => {
  const canvasTarget = useSpriteModeCanvasTarget();
  const canvasPaint = useSpriteModeCanvasPaint();
  const changeOrder = useSpriteModeChangeOrder();
  const { canvasProps } = useSpriteCanvas({
    display: {
      scale: 24,
      showGrid: true,
      target: canvasTarget.activeSprite,
    },
    interaction: {
      activeColorIndex: canvasPaint.activeSlot,
      currentSelectPalette: canvasPaint.activePalette,
      isChangeOrderMode: changeOrder.isChangeOrderMode,
      onChange: canvasPaint.handleTileChange,
      tool: canvasPaint.tool,
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
