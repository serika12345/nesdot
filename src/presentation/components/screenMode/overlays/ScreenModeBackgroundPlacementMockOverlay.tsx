import { styled } from "@mui/material/styles";
import React from "react";

interface ScreenModeBackgroundPlacementMockOverlayProps {
  placementHeight: number;
  placementWidth: number;
  placementX: number;
  placementY: number;
  screenZoomLevel: number;
}

const shouldForwardOverlayProp = (prop: PropertyKey): boolean =>
  prop !== "overlayHeight" &&
  prop !== "overlayLeft" &&
  prop !== "overlayTop" &&
  prop !== "overlayWidth";

const OverlayRoot = styled("div", {
  shouldForwardProp: shouldForwardOverlayProp,
})<{
  overlayHeight: number;
  overlayLeft: number;
  overlayTop: number;
  overlayWidth: number;
}>(({ overlayHeight, overlayLeft, overlayTop, overlayWidth }) => ({
  position: "absolute",
  left: overlayLeft,
  top: overlayTop,
  width: overlayWidth,
  height: overlayHeight,
  borderRadius: 0,
  border: "0.125rem dashed rgba(20, 184, 166, 0.9)",
  background: "rgba(45, 212, 191, 0.14)",
  boxShadow: "0 0 0 0.375rem rgba(45, 212, 191, 0.08)",
  pointerEvents: "none",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
}));

/**
 * screen mode の BG 編集カーソルを stage 上へ重ね描画します。
 * BG タイル配置では 8x8、BG 属性配置では 16x16 のスナップ領域を表示します。
 */
export const ScreenModeBackgroundPlacementMockOverlay: React.FC<
  ScreenModeBackgroundPlacementMockOverlayProps
> = ({
  placementHeight,
  placementWidth,
  placementX,
  placementY,
  screenZoomLevel,
}) => {
  const overlayLeft = placementX * screenZoomLevel;
  const overlayTop = placementY * screenZoomLevel;
  const overlayWidth = placementWidth * screenZoomLevel;
  const overlayHeight = placementHeight * screenZoomLevel;

  return (
    <OverlayRoot
      role="img"
      aria-label="BG配置プレビュー"
      overlayLeft={overlayLeft}
      overlayTop={overlayTop}
      overlayWidth={overlayWidth}
      overlayHeight={overlayHeight}
    />
  );
};
