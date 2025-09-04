// App.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
    CanvasActions,
    Container,
    CurrentColors,
    H3,
    H4,
    LeftPane,
    RightPane,
    SmallNote,
    Spacer,
    Swatch,
    SwatchWrap,
    Toolbar,
    ToolButton,
} from "./App.styles";
import { PalettePicker } from "./components/PalettePicker";
import { PixelCanvas } from "./components/PixelCanvas";
import { NES_PALETTE_HEX } from "./nes/palette";
import { ColorIndexOfPalette, PaletteIndex, SpriteTile, SpriteTileND, useProjectState } from "./store/projectState";

// ★ 追加: 任意サイズ対応ユーティリティ
import { Tool } from "./components/hooks/useCanvas";
import { SlotButton, SlotRow } from "./components/PalettePicker.styles";
import useExportImage from "./hooks/useExportImage";
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
    const palettes = useProjectState((s) => s.palettes);
    const tile = useProjectState((s) => s.tile);

    // UI 用の一時状態はローカルで維持
    const [tool, setTool] = useState<Tool>("pen");
    const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
    const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1); // 0は透明スロット扱い
    const { exportChr, exportPng, exportSvgSimple } = useExportImage();

    const handlePaletteClick = (activePalette: number, activeSlot: number) => {
        setActivePalette(activePalette as PaletteIndex);
        setActiveSlot(activeSlot as ColorIndexOfPalette);
    };
    // ★ zustand の setState で部分更新
    const setTile = (t: SpriteTile) => useProjectState.setState({ tile: t });

    // ★ 幅・高さ入力（8刻み）ハンドラ（非破壊版へ差し替え）
    const setWidth = (nextW: number) => {
        if (Number.isNaN(nextW) || nextW < 8 || nextW % 8 !== 0) return;
        setTile(resizeTileND(tile as SpriteTileND, nextW, tile.height, { anchor: "top-left", fill: 0 }));
    };
    const setHeight = (nextH: number) => {
        if (Number.isNaN(nextH) || nextH < 8 || nextH % 8 !== 0) return;
        setTile(resizeTileND(tile as SpriteTileND, tile.width, nextH, { anchor: "top-left", fill: 0 }));
    };

    return (
        <Container>
            <LeftPane>
                <Toolbar>
                    {/* ★ 旧: 8x8/8x16 ラジオ -> 新: 幅/高さセレクタ（8刻み） */}
                    <label>幅</label>
                    <input
                        type="number"
                        value={tile.width}
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
                        value={tile.height}
                        onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                        step={8}
                        min={8}
                        max={128}
                        style={{ width: 80 }}
                    />

                    <Spacer />

                    <ToolButton onClick={() => setTool("pen")} active={tool === "pen"}>
                        ペン
                    </ToolButton>
                    <ToolButton onClick={() => setTool("eraser")} active={tool === "eraser"}>
                        消しゴム
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
                    scale={24}
                    showGrid={true}
                    tool={tool}
                    currentSelectPalette={activePalette as PaletteIndex}
                    activeColorIndex={palettes[activePalette][activeSlot] as ColorIndexOfPalette}
                    onChange={setTile}
                />

                <CanvasActions>
                    <button onClick={() => exportChr(tile, activePalette)}>CHRエクスポート</button>
                    <button onClick={() => exportPng(tile)}>PNGエクスポート</button>
                    <button onClick={() => exportSvgSimple(tile)}>SVGエクスポート</button>
                    <button onClick={() => setTile(makeEmptyTile(tile.width, tile.height, tile.paletteIndex))}>クリア</button>
                </CanvasActions>
            </LeftPane>

            <RightPane>
                <H3>パレット</H3>
                <PalettePicker />

                <div>
                    <H4>現在のパレット</H4>
                    {palettes.map((palette, idx) => {
                        return (
                            <>
                                <div>Palette {idx}</div>
                                <CurrentColors>
                                    {palette.map((idx, i) => (
                                        <SwatchWrap key={i}>
                                            <Swatch transparent={i === 0} bg={i === 0 ? undefined : NES_PALETTE_HEX[idx]} />
                                            <div>slot{i}</div>
                                        </SwatchWrap>
                                    ))}
                                </CurrentColors>
                            </>
                        );
                    })}
                    <SmallNote>NESスプライトは「4色パレット（うち1色は透明）」＋各ピクセルは0..3の2bitです。</SmallNote>
                </div>
            </RightPane>
        </Container>
    );
};

const root = createRoot(document.body);
root.render(<App />);
