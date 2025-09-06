import React from "react";
import { ColorIndexOfPalette, SpriteTile } from "../store/projectState";
import { useSpriteCanvas } from "./hooks/useSpriteCanvas";

interface Props {
    target: number; // 表示対象スプライトインデックス
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
    tool: "pen" | "eraser";
    currentSelectPalette: ColorIndexOfPalette;
    activeColorIndex: ColorIndexOfPalette; // 0..3（0は透明スロット）
    onChange: (next: SpriteTile, currentSprite: number) => void;
}

export const SpriteCanvas: React.FC<Props> = (props) => {
    const { canvasProps } = useSpriteCanvas(props);

    return <canvas {...canvasProps} css={{ border: "1px solid #aaa", touchAction: "none" }} />;
};
