import { styled } from "@mui/material/styles";
import React from "react";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../common/preview/BackgroundTilePreview";

interface BackgroundPlacementOverlayPlacement {
  height: number;
  width: number;
  x: number;
  y: number;
}

type BackgroundPlacementOverlayPreview =
  | {
      kind: "none";
    }
  | {
      kind: "tile";
      palette: NesSubPalette;
      tile: BackgroundTile;
      universalBackgroundColor: NesColorIndex;
    };

interface ScreenModeBackgroundPlacementMockOverlayProps {
  placement: BackgroundPlacementOverlayPlacement;
  preview: BackgroundPlacementOverlayPreview;
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

const OverlayPreview = styled("div")({
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  opacity: 0.94,
});

/**
 * screen mode の BG 編集カーソルを stage 上へ重ね描画します。
 * BG タイル配置では 8x8、BG 属性配置では 16x16 のスナップ領域を表示します。
 */
export const ScreenModeBackgroundPlacementMockOverlay: React.FC<
  ScreenModeBackgroundPlacementMockOverlayProps
> = ({ placement, preview, screenZoomLevel }) => {
  const overlayLeft = placement.x * screenZoomLevel;
  const overlayTop = placement.y * screenZoomLevel;
  const overlayWidth = placement.width * screenZoomLevel;
  const overlayHeight = placement.height * screenZoomLevel;

  return (
    <OverlayRoot
      role="img"
      aria-label="BG配置プレビュー"
      overlayLeft={overlayLeft}
      overlayTop={overlayTop}
      overlayWidth={overlayWidth}
      overlayHeight={overlayHeight}
    >
      {preview.kind === "tile" ? (
        <OverlayPreview>
          <BackgroundTilePreview
            ariaLabel="BG配置タイルプレビューキャンバス"
            scale={screenZoomLevel}
            tile={preview.tile}
            palette={preview.palette}
            universalBackgroundColor={preview.universalBackgroundColor}
          />
        </OverlayPreview>
      ) : (
        <></>
      )}
    </OverlayRoot>
  );
};
