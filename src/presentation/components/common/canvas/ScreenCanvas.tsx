import { styled } from "@mui/material/styles";
import React from "react";
import { useScreenCanvas } from "../../../../infrastructure/browser/canvas/useScreenCanvas";

interface Props {
  scale?: number; // ピクセル拡大倍率
  showGrid?: boolean;
  ariaLabel?: string;
}

const CanvasElement = styled("canvas")({
  touchAction: "none",
  imageRendering: "pixelated",
});

/**
 * スクリーンプレビュー用 canvas を描画する薄いラッパーです。
 * canvas DOM と描画フックを接続し、呼び出し側は表示パラメータだけ渡せるようにします。
 */
export const ScreenCanvas: React.FC<Props> = ({ ariaLabel, ...params }) => {
  const { canvasProps } = useScreenCanvas(params);

  return <CanvasElement aria-label={ariaLabel} {...canvasProps} />;
};
