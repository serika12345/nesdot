// App.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { CanvasActions, Container, H3, LeftPane, RightPane, Spacer, Toolbar, ToolButton } from "./App.styles";
import { PalettePicker } from "./components/PalettePicker";
import { PixelCanvas } from "./components/PixelCanvas";
import { NES_PALETTE_HEX } from "./nes/palette";
import { ColorIndexOfPalette, PaletteIndex, SpriteTile, SpriteTileND, useProjectState } from "./store/projectState";

// ★ 追加: 任意サイズ対応ユーティリティ
import { Tool } from "./components/hooks/useCanvas";
import { SlotButton, SlotRow } from "./components/PalettePicker.styles";
import useExportImage from "./hooks/useExportImage";
import useImportImage from "./hooks/useImportImage";
import { makeTile, resizeTileND } from "./tiles/utils";

declare global {
    interface Window {
        api?: {
            saveBytes: (data: Uint8Array, defaultFileName: string) => Promise<void>;
        };
    }
}

// ★ makeEmptyTile は任意サイズ対応（既定8x8）
function makeEmptyTile(width = 8, height = 8, paletteIndex: PaletteIndex): SpriteTile {
    return makeTile(width, height, 0, paletteIndex);
}

export const App: React.FC = () => {
    // ★ App 内の ProjectState は zustand から取得
    // もともとの spriteSize は廃止し、tile.width/height を真実のソースにします
    const projectState = useProjectState((s) => s);
    const palettes = useProjectState((s) => s.palettes);
    // UI 用の一時状態はローカルで維持
    const [tool, setTool] = useState<Tool>("pen");
    const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
    const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1); // 0は透明スロット扱い
    const [activeSprite, setActiveSprite] = useState<number>(0); // TODO: スプライトごとに編集できるようにする
    const { exportChr, exportPng, exportSvgSimple, exportJSON } = useExportImage();
    const { importJSON } = useImportImage();
    const activeTile = useProjectState((s) => s.sprites[activeSprite]);
    const sprites = useProjectState((s) => s.sprites);

    const handlePaletteClick = (activePalette: number, activeSlot: number) => {
        setActivePalette(activePalette as PaletteIndex);
        setActiveSlot(activeSlot as ColorIndexOfPalette);
    };
    // ★ zustand の setState で部分更新
    const setTile = (t: SpriteTile, index: number) => {
        const newSprites = [...sprites];
        newSprites[index] = t;
        useProjectState.setState({ sprites: newSprites });
    };

    // ★ 幅・高さ入力（8刻み）ハンドラ（非破壊版へ差し替え）
    const setWidth = (nextW: number) => {
        if (Number.isNaN(nextW) || nextW < 8 || nextW % 8 !== 0) return;
        setTile(
            resizeTileND(activeTile as SpriteTileND, nextW, activeTile.height, { anchor: "top-left", fill: 0 }),
            activeSprite
        );
    };
    const setHeight = (nextH: number) => {
        if (Number.isNaN(nextH) || nextH < 8 || nextH % 8 !== 0) return;
        setTile(resizeTileND(activeTile as SpriteTileND, activeTile.width, nextH, { anchor: "top-left", fill: 0 }), activeSprite);
    };
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

    return (
        <Container>
            <LeftPane>
                <Toolbar>
                    {/* ★ 旧: 8x8/8x16 ラジオ -> 新: 幅/高さセレクタ（8刻み） */}
                    <label>幅</label>
                    <input
                        type="number"
                        value={activeTile.width}
                        onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                        step={8}
                        min={8}
                        // 任意で上限（例：128）
                        max={128}
                        style={{ width: 80 }}
                    />
                    <label>高さ</label>
                    <input
                        type="number"
                        value={activeTile.height}
                        onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                        step={8}
                        min={8}
                        max={128}
                        style={{ width: 80 }}
                    />
                    <label>スプライト</label>
                    <input
                        type="number"
                        value={activeSprite}
                        onChange={(e) => setActiveSprite(parseInt(e.target.value))}
                        step={1}
                        min={0}
                        max={64}
                        style={{ width: 80 }}
                    />

                    <Spacer />

                    <ToolButton onClick={() => setTool("pen")} active={tool === "pen"}>
                        ペン
                    </ToolButton>
                    <ToolButton onClick={() => setTool("eraser")} active={tool === "eraser"}>
                        消しゴム
                    </ToolButton>
                    <ToolButton
                        onClick={() => {
                            if (confirm("本当にクリアしますか？")) {
                                setTile(
                                    makeEmptyTile(activeTile.width, activeTile.height, activeTile.paletteIndex),
                                    activeSprite
                                );
                            }
                        }}
                    >
                        クリア
                    </ToolButton>
                </Toolbar>

                <div css={{ display: "grid" }}>
                    {palettes.map((palette, i) => {
                        return (
                            <>
                                <div>Palette {i}</div>
                                <SlotRow>
                                    {palette.map((idx, j) => (
                                        <>
                                            <SlotButton
                                                key={j}
                                                onClick={() => handlePaletteClick(i, j)}
                                                title={j === 0 ? "Slot 0: Transparent" : `Slot ${j}`}
                                                active={activeSlot === j && activePalette === i}
                                                transparent={j === 0}
                                                bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                                            />
                                            <div>slot{j}</div>
                                        </>
                                    ))}
                                </SlotRow>
                            </>
                        );
                    })}
                </div>

                <PixelCanvas
                    target={activeSprite}
                    scale={24}
                    showGrid={true}
                    tool={tool}
                    currentSelectPalette={activePalette as PaletteIndex}
                    activeColorIndex={palettes[activePalette][activeSlot] as ColorIndexOfPalette}
                    onChange={setTile}
                />

                <CanvasActions>
                    <button onClick={() => exportChr(activeTile, activePalette)}>CHRエクスポート</button>
                    <button onClick={() => exportPng(activeTile)}>PNGエクスポート</button>
                    <button onClick={() => exportSvgSimple(activeTile)}>SVGエクスポート</button>
                    <button onClick={() => exportJSON(projectState)}>保存</button>
                    <button onClick={handleImport}>復元</button>
                </CanvasActions>
            </LeftPane>

            <RightPane>
                <H3>パレット</H3>
                <PalettePicker />
            </RightPane>
        </Container>
    );
};

const root = createRoot(document.body);
root.render(<App />);
