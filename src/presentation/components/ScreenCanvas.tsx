import React from "react";
import { useScreenCanvas } from "../../infrastructure/browser/canvas/useScreenCanvas";

interface Props {
  scale?: number; // ピクセル拡大倍率
  showGrid?: boolean;
  ariaLabel?: string;
}

export const ScreenCanvas: React.FC<Props> = ({ ariaLabel, ...params }) => {
  const { canvasProps } = useScreenCanvas(params);

  return (
    <canvas
      aria-label={ariaLabel}
      {...canvasProps}
      css={{
        display: "block",
        touchAction: "none",
        imageRendering: "pixelated",
      }}
    />
  );
};
