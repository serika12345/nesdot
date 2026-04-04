import { styled } from "@mui/material/styles";
import React from "react";
import { useScreenCanvas } from "../../../infrastructure/browser/canvas/useScreenCanvas";

interface Props {
  scale?: number; // ピクセル拡大倍率
  showGrid?: boolean;
  ariaLabel?: string;
}

const CanvasElement = styled("canvas")({
  touchAction: "none",
  imageRendering: "pixelated",
});

export const ScreenCanvas: React.FC<Props> = ({ ariaLabel, ...params }) => {
  const { canvasProps } = useScreenCanvas(params);

  return <CanvasElement aria-label={ariaLabel} {...canvasProps} />;
};
