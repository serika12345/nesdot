import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { useSpriteCanvas } from "../../../../infrastructure/browser/canvas/useSpriteCanvas";
import {
  useSpriteModeCanvasPaint,
  useSpriteModeCanvasTarget,
  useSpriteModeChangeOrder,
} from "../core/SpriteModeStateProvider";

const CanvasElement = styled("canvas")({
  touchAction: "none",
  imageRendering: "pixelated",
});

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
      <CanvasElement {...canvasProps} />
    </Stack>
  );
};
