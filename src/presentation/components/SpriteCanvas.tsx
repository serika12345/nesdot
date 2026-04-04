import React from "react";
import { styled } from "@mui/material/styles";
import {
  ColorIndexOfPalette,
  PaletteIndex,
  SpriteTile,
} from "../../application/state/projectStore";
import { useSpriteCanvas } from "../../infrastructure/browser/canvas/useSpriteCanvas";

interface Props {
    isChangeOrderMode?: boolean; // 並べ替えモード
    target: number; // 表示対象スプライトインデックス
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
    tool: "pen" | "eraser";
    currentSelectPalette: PaletteIndex;
    activeColorIndex: ColorIndexOfPalette; // 0..3（0は透明スロット）
    onChange: (next: SpriteTile, currentSprite: number) => void;
}

const CanvasElement = styled("canvas")({
    touchAction: "none",
    imageRendering: "pixelated",
});

export const SpriteCanvas: React.FC<Props> = (props) => {
    const { canvasProps } = useSpriteCanvas(props);

    return <CanvasElement {...canvasProps} />;
};
