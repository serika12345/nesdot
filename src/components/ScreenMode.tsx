// components/modes/ScreenMode.tsx
import React, { useState } from "react";
import { CanvasActions } from "../App.styles";
import useExportImage from "../hooks/useExportImage";
import useImportImage from "../hooks/useImportImage";
import { getHexArrayForScreen, SpriteInScreen, useProjectState } from "../store/projectState";
import { ScreenCanvas } from "./ScreenCanvas";
import { isValid } from "./hooks/useScreenCanvas";

export const ScreenMode: React.FC = () => {
    const [spriteNumber, setSpriteNumber] = useState(0);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<number | null>(null);
    const screen = useProjectState((s) => s.screen);
    const sprites = useProjectState((s) => s.sprites);
    const spritesOnScreen = useProjectState((s) => s.screen.sprites);
    const projectState = useProjectState((s) => s);
    const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
    const { importJSON } = useImportImage();
    // ★ インポートハンドラ
    const handleImport = async () => {
        try {
            await importJSON((data) => {
                useProjectState.setState(data);
            });
        } catch (err) {
            alert("インポートに失敗しました: " + err);
        }
    };

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
        const sprite: SpriteInScreen = {
            ...spriteTile,
            x,
            y,
            spriteIndex: spriteNumber,
        };
        const newScreen = {
            ...screen,
            sprites: [...screen.sprites, sprite],
        };
        if (!isValid(newScreen)) {
            alert("スプライトの配置が不正です（同一行に8個を超えるスプライトが配置されている可能性があります）");
            return;
        }
        useProjectState.setState({ screen: newScreen });
        if (selectedSpriteIndex == null) {
            setSelectedSpriteIndex(newScreen.sprites.length - 1);
        }
        alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
    };

    return (
        <>
            {/* TODO: モーダル */}
            <nav
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
            </nav>
            <select>
                {spritesOnScreen.length === 0 && <option>スプライトが配置されていません</option>}
                {spritesOnScreen.map((sprite, index) => {
                    return (
                        <option key={index} value={index} onClick={() => setSelectedSpriteIndex(index)}>
                            {`#${index} spriteIndex: ${sprite.spriteIndex} (${sprite.width}x${sprite.height}) position: ${sprite.x},${sprite.y}`}
                        </option>
                    );
                })}
            </select>

            {selectedSpriteIndex !== null && spritesOnScreen[selectedSpriteIndex] && (
                <div>
                    <h3>選択中のスプライト情報</h3>
                    <p>スプライト番号: {selectedSpriteIndex}</p>
                    <p>元のスプライトシート内インデックス: {spritesOnScreen[selectedSpriteIndex].spriteIndex}</p>
                    <p>
                        サイズ: {spritesOnScreen[selectedSpriteIndex].width}x{spritesOnScreen[selectedSpriteIndex].height}
                    </p>
                    <p>
                        <label>
                            位置: X
                            <input
                                type="number"
                                value={spritesOnScreen[selectedSpriteIndex].x}
                                onChange={(e) => {
                                    const newX = Number(e.target.value);
                                    const newSprites = spritesOnScreen.map((s, i) =>
                                        i === selectedSpriteIndex ? { ...s, x: newX } : s
                                    );
                                    useProjectState.setState({
                                        screen: {
                                            ...screen,
                                            sprites: newSprites,
                                        },
                                    });
                                }}
                            />
                            Y
                            <input
                                type="number"
                                value={spritesOnScreen[selectedSpriteIndex].y}
                                onChange={(e) => {
                                    const newY = Number(e.target.value);
                                    const newSprites = spritesOnScreen.map((s, i) =>
                                        i === selectedSpriteIndex ? { ...s, y: newY } : s
                                    );
                                    useProjectState.setState({
                                        screen: {
                                            ...screen,
                                            sprites: newSprites,
                                        },
                                    });
                                }}
                            />
                        </label>
                    </p>
                    <button
                        onClick={() => {
                            const newSprites = spritesOnScreen.filter((_, i) => i !== selectedSpriteIndex);
                            useProjectState.setState({
                                screen: {
                                    ...screen,
                                    sprites: newSprites,
                                },
                            });
                            setSelectedSpriteIndex(null);
                        }}
                    >
                        このスプライトを削除
                    </button>
                </div>
            )}

            <ScreenCanvas scale={5} showGrid={true} />

            <CanvasActions>
                <button onClick={() => exportPng(getHexArrayForScreen(screen))}>PNGエクスポート</button>
                <button onClick={() => exportSvgSimple(getHexArrayForScreen(screen))}>SVGエクスポート</button>
                <button onClick={() => exportJSON(projectState)}>保存</button>
                <button onClick={handleImport}>復元</button>
            </CanvasActions>
        </>
    );
};
