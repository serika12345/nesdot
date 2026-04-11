import Box from "@mui/material/Box";
import React from "react";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../domain/project/projectV2";
import {
  SCREEN_BG_PLACEMENT_OVERLAY_PREVIEW_CLASS_NAME,
  SCREEN_BG_PLACEMENT_OVERLAY_ROOT_CLASS_NAME,
} from "../../../styleClassNames";
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
      className={SCREEN_BG_PLACEMENT_OVERLAY_ROOT_CLASS_NAME}
      role="img"
      aria-label="BG配置プレビュー"
      position="absolute"
      borderRadius={0}
      display="flex"
      alignItems="flex-start"
      justifyContent="flex-start"
      style={{
        left: overlayLeft,
        top: overlayTop,
        width: overlayWidth,
        height: overlayHeight,
      }}
    >
      {preview.kind === "tile" ? (
        <div className={SCREEN_BG_PLACEMENT_OVERLAY_PREVIEW_CLASS_NAME}>
          <BackgroundTilePreview
            ariaLabel="BG配置タイルプレビューキャンバス"
            scale={screenZoomLevel}
            tile={preview.tile}
            palette={preview.palette}
            universalBackgroundColor={preview.universalBackgroundColor}
          />
        </div>
      ) : (
        <></>
      )}
    </Box>
  );
};
