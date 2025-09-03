import React from "react";
import { Pixel2bpp, SpriteTile } from "../../src/store/projectState";
import { useCanvas } from "./hooks/useCanvas";

interface Props {
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
    tool: "pen" | "eraser";
    activeColorIndex: Pixel2bpp; // 0..3（0は透明スロット）
    onChange: (next: SpriteTile) => void;
}

export const PixelCanvas: React.FC<Props> = (props) => {
    const { canvasProps } = useCanvas(props);

    return <canvas {...canvasProps} css={{ border: "1px solid #aaa", touchAction: "none" }} />;
};
