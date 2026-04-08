import { styled } from "@mui/material/styles";
import * as O from "fp-ts/Option";
import React from "react";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../domain/nes/nesProject";
import { nesIndexToCssHex } from "../../../../domain/nes/palette";
import { type BackgroundTile } from "../../../../domain/project/projectV2";

interface BackgroundTilePreviewProps {
  scale: number;
  tile: BackgroundTile;
  palette: NesSubPalette;
  universalBackgroundColor: NesColorIndex;
}

const CanvasElement = styled("canvas")({
  display: "block",
  imageRendering: "pixelated",
  backgroundImage: "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
  backgroundSize: "0.5rem 0.5rem",
});

const resolvePixelHex = (
  palette: NesSubPalette,
  universalBackgroundColor: NesColorIndex,
  colorIndex: number,
): string => {
  if (colorIndex === 0) {
    return nesIndexToCssHex(universalBackgroundColor);
  }

  return nesIndexToCssHex(palette[colorIndex] ?? universalBackgroundColor);
};

const drawBackgroundTilePreview = (
  canvasElement: HTMLCanvasElement,
  tile: BackgroundTile,
  palette: NesSubPalette,
  scale: number,
  universalBackgroundColor: NesColorIndex,
): void => {
  const context = canvasElement.getContext("2d");

  if (context instanceof CanvasRenderingContext2D === false) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  Object.assign(context, { imageSmoothingEnabled: false });

  tile.pixels.forEach((row, rowIndex) => {
    row.forEach((colorIndex, columnIndex) => {
      Object.assign(context, {
        fillStyle: resolvePixelHex(
          palette,
          universalBackgroundColor,
          colorIndex,
        ),
      });
      context.fillRect(columnIndex * scale, rowIndex * scale, scale, scale);
    });
  });
};

const BackgroundTilePreviewComponent: React.FC<BackgroundTilePreviewProps> = ({
  palette,
  scale,
  tile,
  universalBackgroundColor,
}) => {
  const canvasElementRef = React.useRef<O.Option<HTMLCanvasElement>>(O.none);

  const handleCanvasRef = React.useCallback(
    (element: HTMLCanvasElement | null) => {
      Object.assign(canvasElementRef, {
        current: O.fromNullable(element),
      });
    },
    [],
  );

  React.useEffect(() => {
    if (O.isNone(canvasElementRef.current)) {
      return;
    }

    drawBackgroundTilePreview(
      canvasElementRef.current.value,
      tile,
      palette,
      scale,
      universalBackgroundColor,
    );
  }, [palette, scale, tile, universalBackgroundColor]);

  return (
    <CanvasElement
      ref={handleCanvasRef}
      width={tile.width * scale}
      height={tile.height * scale}
      aria-hidden="true"
    />
  );
};

export const BackgroundTilePreview = React.memo(BackgroundTilePreviewComponent);
