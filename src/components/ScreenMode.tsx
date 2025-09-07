// components/modes/ScreenMode.tsx
import React, { useState } from "react";
import { Sprite, useProjectState } from "../store/projectState";
import { ScreenCanvas } from "./ScreenCanvas";

export const ScreenMode: React.FC = () => {
    const [spriteNumber, setSpriteNumber] = useState(0);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const screen = useProjectState((s) => s.screen);
    const sprites = useProjectState((s) => s.sprites);
    const handleAddSprite = () => {
        const spriteTile = sprites[spriteNumber];
        if (!spriteTile) {
            alert("指定されたスプライト番号のスプライトが存在しません");
            return;
        }
        if (screen.sprites.length >= 64) {
            alert("スプライトは最大64個までです");
            return;
        }
        const sprite: Sprite = {
            x,
            y,
            spriteIndex: spriteNumber,
            paletteIndex: spriteTile.paletteIndex,
            pixels: spriteTile.pixels,
        };
        screen.sprites.push(sprite);
        useProjectState.setState({ screen });
        alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
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
