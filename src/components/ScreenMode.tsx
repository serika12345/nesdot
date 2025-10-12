// components/modes/ScreenMode.tsx
import React, { useState } from "react";
import { CanvasActions } from "../App.styles";
import useExportImage from "../hooks/useExportImage";
import useImportImage from "../hooks/useImportImage";
import { getHexArrayForScreen, SpriteInScreen, useProjectState } from "../store/projectState";
import { ScreenCanvas } from "./ScreenCanvas";
// import { isValid } from "./hooks/useScreenCanvas"; // ← 集約のため未使用になります。削除推奨。

export const ScreenMode: React.FC = () => {
    const [spriteNumber, setSpriteNumber] = useState(0);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<number | null>(() => {
        if (useProjectState.getState().screen.sprites.length > 0) return 0;
        return null;
    });
    const screen = useProjectState((s) => s.screen);
    const sprites = useProjectState((s) => s.sprites);
    const spritesOnScreen = useProjectState((s) => s.screen.sprites);
    const projectState = useProjectState((s) => s);
    const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
    const { importJSON } = useImportImage();

    // 制約値（必要に応じて1か所で調整できます）
    const SCREEN_WIDTH = screen.width;
    const SCREEN_HEIGHT = screen.height;
    const MAX_SPRITES = 64;
    const MAX_PER_SCANLINE = 8;

    type ScanReport = { ok: true } | { ok: false; errors: string[] };

    /**
     * スクリーン制約チェック
     * 与えた screen を走査し、制約違反があれば理由を返します。
     * checkee を省略した場合はストアの現状態を検査します。
     */
    const scan = (checkee = useProjectState.getState().screen): ScanReport => {
        const errors: string[] = [];
        const list = checkee.sprites;

        // 総数
        if (list.length > MAX_SPRITES) {
            errors.push(`スプライト総数が上限(${MAX_SPRITES})を超えています: ${list.length}`);
        }

        // 画面境界
        // list.forEach((sp, i) => {
        //     const outRight = sp.x < 0 || sp.x > SCREEN_WIDTH - sp.width;
        //     const outBottom = sp.y < 0 || sp.y > SCREEN_HEIGHT - sp.height;
        //     if (outRight || outBottom) {
        //         errors.push(
        //             `#${i} (spriteIndex:${sp.spriteIndex}) の位置が画面外です: x=${sp.x}, y=${sp.y} / size=${sp.width}x${sp.height}`
        //         );
        //     }
        // });

        // スキャンライン上のスプライト数（行あたり最大8）
        // 行ごとのカウントを作成
        const scanlineCount = new Array<number>(SCREEN_HEIGHT).fill(0);
        list.forEach((sp) => {
            const y0 = Math.max(0, sp.y);
            const y1 = Math.min(SCREEN_HEIGHT - 1, sp.y + sp.height - 1);
            for (let yy = y0; yy <= y1; yy++) {
                scanlineCount[yy]++;
            }
        });
        const violLines: number[] = [];
        for (let yy = 0; yy < SCREEN_HEIGHT; yy++) {
            if (scanlineCount[yy] > MAX_PER_SCANLINE) violLines.push(yy);
        }
        if (violLines.length) {
            // 多すぎる場合は先頭数行だけ提示
            const sample = violLines.slice(0, 10).join(", ");
            errors.push(`同一スキャンライン上のスプライト数が上限(${MAX_PER_SCANLINE})を超えています。y=${sample}`);
        }

        return errors.length ? { ok: false, errors } : { ok: true };
    };

    // ★ インポートハンドラ
    const handleImport = async () => {
        try {
            await importJSON((data) => {
                useProjectState.setState(data);
                // インポート後に制約チェック
                const result = scan(data.screen);
                if (result.ok === false) {
                    alert("インポートしたデータに制約違反があります:\n" + result.errors.join("\n"));
                }
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
        const candidate: SpriteInScreen = {
            ...spriteTile,
            x,
            y,
            spriteIndex: spriteNumber,
        };
        const newScreen = {
            ...screen,
            sprites: [...screen.sprites, candidate],
        };

        // 集約された制約チェック
        const report = scan(newScreen);
        if (report.ok === false) {
            alert("スプライトの追加に失敗しました。制約違反:\n" + report.errors.join("\n"));
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
            <select onChange={(e) => setSelectedSpriteIndex(Number(e.target.value))} value={selectedSpriteIndex ?? ""}>
                {spritesOnScreen.length === 0 && <option>スプライトが配置されていません</option>}
                {spritesOnScreen.map((sprite, index) => {
                    return (
                        <option key={index} value={index}>
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
                                    const newScreen = { ...screen, sprites: newSprites };
                                    const report = scan(newScreen);
                                    if (report.ok === false) {
                                        alert("位置の更新に失敗しました。制約違反:\n" + report.errors.join("\n"));
                                        return;
                                    }
                                    useProjectState.setState({ screen: newScreen });
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
                                    const newScreen = { ...screen, sprites: newSprites };
                                    const report = scan(newScreen);
                                    if (report.ok === false) {
                                        alert("位置の更新に失敗しました。制約違反:\n" + report.errors.join("\n"));
                                        return;
                                    }
                                    useProjectState.setState({ screen: newScreen });
                                }}
                            />
                        </label>
                    </p>
                    <button
                        onClick={() => {
                            const newSprites = spritesOnScreen.filter((_, i) => i !== selectedSpriteIndex);
                            const newScreen = { ...screen, sprites: newSprites };
                            // 削除は基本的に制約を緩和しますが、念のため scan を回しておきます
                            const report = scan(newScreen);
                            if (report.ok === false) {
                                alert("削除後の状態で制約違反が検出されました:\n" + report.errors.join("\n"));
                                // ここでは復旧の必要はないため通知のみ
                            }
                            useProjectState.setState({ screen: newScreen });
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
