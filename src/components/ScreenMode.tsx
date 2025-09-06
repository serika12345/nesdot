// components/modes/ScreenMode.tsx
import React, { useState } from "react";
import { ScreenCanvas } from "./ScreenCanvas";

export const ScreenMode: React.FC = () => {
    const [spriteNumber, setSpriteNumber] = useState(0);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const handleAddSprite = () => {
        alert(`スプライトを追加: 番号=${spriteNumber}, X=${x}, Y=${y} (未実装)`);
    };
    return (
        <>
            {/* TODO: モーダル */}
            <div
                css={{
                    display: "flex",
                    gap: "12px",
                }}
            >
                <label>スプライト番号</label>
                <input
                    type="number"
                    min={0}
                    max={64}
                    defaultValue={0}
                    onChange={(e) => setSpriteNumber(Number(e.target.value))}
                />
                <label>X座標</label>
                <input type="number" min={0} max={256} defaultValue={0} onChange={(e) => setX(Number(e.target.value))} />
                <label>Y座標</label>
                <input type="number" min={0} max={240} defaultValue={0} onChange={(e) => setY(Number(e.target.value))} />
                <button onClick={handleAddSprite}>スプライトを追加</button>
            </div>

            {/* TODO: 配置されたスプライトを描画する */}
            <ScreenCanvas scale={5} showGrid={true} />
        </>
    );
};
