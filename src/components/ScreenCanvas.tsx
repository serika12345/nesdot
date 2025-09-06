import React from "react";
import { useScreenCanvas } from "./hooks/useScreenCanvas";

interface Props {
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
}

export const ScreenCanvas: React.FC<Props> = (props) => {
    const { canvasProps } = useScreenCanvas(props);

    return <canvas {...canvasProps} css={{ border: "1px solid #aaa", touchAction: "none" }} />;
};
