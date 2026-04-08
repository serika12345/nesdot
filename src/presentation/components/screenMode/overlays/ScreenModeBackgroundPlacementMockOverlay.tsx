import { styled } from "@mui/material/styles";
import React from "react";

interface ScreenModeBackgroundPlacementMockOverlayProps {
  screenZoomLevel: number;
}

const MOCK_STAGE_TILE_X = 10;
const MOCK_STAGE_TILE_Y = 6;
const MOCK_STAGE_TILE_SIZE = 8;

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
  borderRadius: "0.625rem",
  border: "0.125rem dashed rgba(20, 184, 166, 0.9)",
  background: "rgba(45, 212, 191, 0.14)",
  boxShadow: "0 0 0 0.375rem rgba(45, 212, 191, 0.08)",
  pointerEvents: "none",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
}));

/**
 * BG タイル掴み状態の stage overlay モックを描画します。
 * 8x8 スナップ位置の見た目だけを提供し、実配置処理は screen mode 側の local state に委ねます。
 */
export const ScreenModeBackgroundPlacementMockOverlay: React.FC<
  ScreenModeBackgroundPlacementMockOverlayProps
> = ({ screenZoomLevel }) => {
  const overlayLeft =
    MOCK_STAGE_TILE_X * MOCK_STAGE_TILE_SIZE * screenZoomLevel;
  const overlayTop = MOCK_STAGE_TILE_Y * MOCK_STAGE_TILE_SIZE * screenZoomLevel;
  const overlayWidth = MOCK_STAGE_TILE_SIZE * screenZoomLevel;
  const overlayHeight = MOCK_STAGE_TILE_SIZE * screenZoomLevel;

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
