// components/modes/ScreenMode.tsx
import React from "react";
import { ScreenCanvas } from "./ScreenCanvas";

export const ScreenMode: React.FC = () => {
    return (
        <>
            <div>
                <button onClick={() => alert("未実装")}>スプライトを追加</button>
            </div>

            <>
                {/* TODO: BGを描画する */}
                <ScreenCanvas scale={5} showGrid={true} />
            </>
        </>
    );
};
