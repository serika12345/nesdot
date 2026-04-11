import React from "react";
import { useScreenCanvas } from "../../../../infrastructure/browser/canvas/useScreenCanvas";
import { APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME } from "../../../styleClassNames";

interface Props {
  scale?: number; // ピクセル拡大倍率
  showGrid?: boolean;
  ariaLabel?: string;
}

/**
 * スクリーンプレビュー用 canvas を描画する薄いラッパーです。
 * canvas DOM と描画フックを接続し、呼び出し側は表示パラメータだけ渡せるようにします。
 */
export const ScreenCanvas: React.FC<Props> = ({ ariaLabel, ...params }) => {
  const { canvasProps } = useScreenCanvas(params);

  return (
    <canvas
      className={APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME}
      aria-label={ariaLabel}
      {...canvasProps}
    />
  );
};
