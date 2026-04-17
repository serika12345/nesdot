import Box from "@mui/material/Box";
import React from "react";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../../common/ui/preview/BackgroundTilePreview";
import {
  backgroundPlacementOverlayStyle,
  backgroundPlacementPreviewLayerStyle,
} from "./ScreenModeBackgroundPlacementMockOverlayStyle";

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
    <Box
      role="img"
      aria-label="BG配置プレビュー"
      position="absolute"
      left={overlayLeft}
      top={overlayTop}
      width={overlayWidth}
      height={overlayHeight}
      borderRadius={0}
      border="0.125rem dashed rgba(20, 184, 166, 0.9)"
      bgcolor="rgba(45, 212, 191, 0.14)"
      boxShadow="0 0 0 0.375rem rgba(20, 184, 166, 0.08)"
      style={backgroundPlacementOverlayStyle}
    >
      {preview.kind === "tile" ? (
        <Box
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          overflow="hidden"
          style={backgroundPlacementPreviewLayerStyle}
        >
          <BackgroundTilePreview
            ariaLabel="BG配置タイルプレビューキャンバス"
            scale={screenZoomLevel}
            tile={preview.tile}
            palette={preview.palette}
            universalBackgroundColor={preview.universalBackgroundColor}
          />
        </Box>
      ) : (
        <></>
      )}
    </Box>
  );
};
