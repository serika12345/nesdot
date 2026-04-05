import { Stack } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type SpriteTile, useProjectState } from "../../../application/state/projectStore";
import { renderSpriteTileToHexArray } from "../../../domain/nes/rendering";
import {
  EmptyTilePreview,
  PixelPreviewCell,
} from "./CharacterModeLayoutPrimitives";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

interface CharacterModeTilePreviewProps {
  scale: number;
  tileOption: O.Option<SpriteTile>;
}

/**
 * キャラクター編集画面用のタイルプレビューです。
 * スプライトパレットを使ってタイルをピクセル単位で描画します。
 */
export const CharacterModeTilePreview: React.FC<
  CharacterModeTilePreviewProps
> = ({ scale, tileOption }) => {
  const spritePalettes = useProjectState((state) => state.nes.spritePalettes);

  if (O.isNone(tileOption)) {
    return <EmptyTilePreview previewWidth={8 * scale} previewHeight={16 * scale} />;
  }

  const tile = tileOption.value;
  const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);

  return (
    <Stack
      spacing={0}
      width={tile.width * scale}
      height={tile.height * scale}
      alignItems="stretch"
    >
      {tile.pixels.map((pixelRow, rowIndex) => (
        <Stack
          key={`pixel-row-${rowIndex}`}
          direction="row"
          spacing={0}
          alignItems="stretch"
        >
          {pixelRow.map((colorIndex, columnIndex) => {
            const hexRowOption = O.fromNullable(hexPixels[rowIndex]);
            const hexOption = pipe(
              hexRowOption,
              O.chain((row) => O.fromNullable(row[columnIndex])),
            );
            const colorHex = pipe(
              hexOption,
              O.getOrElse(() => PREVIEW_TRANSPARENT_HEX),
            );
            const isTransparent = colorIndex === 0;

            return (
              <PixelPreviewCell
                key={`pixel-${rowIndex}-${columnIndex}`}
                pixelSize={scale}
                colorHex={isTransparent ? "transparent" : colorHex}
              />
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
};
