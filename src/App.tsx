// App.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { CanvasActions, Container, H3, LeftPane, RightPane, Spacer, Toolbar, ToolButton } from "./App.styles";
import { PalettePicker } from "./components/PalettePicker";
import { SpriteCanvas } from "./components/SpriteCanvas";
import { NES_PALETTE_HEX } from "./nes/palette";
import { ColorIndexOfPalette, PaletteIndex, SpriteTile, SpriteTileND, useProjectState } from "./store/projectState";

// ★ 追加: 任意サイズ対応ユーティリティ
import { Tool } from "./components/hooks/useSpriteCanvas";
import { SlotButton } from "./components/PalettePicker.styles";
import { ScreenCanvas } from "./components/ScreenCanvas";
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
    const [editMode, setEditMode] = useState<"screen" | "sprite">("sprite");

    const handlePaletteClick = (activeSlot: number) => {
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

    const handleSpriteChange = (index: string) => {
        const i = parseInt(index);
        setActiveSprite(i);
        const targetSprite = sprites[i];
        setActivePalette(targetSprite.paletteIndex);
    };

    return (
        <Container>
            <LeftPane>
                {editMode === "sprite" && (
                    <Toolbar>
                        {/* ★ 旧: 8x8/8x16 ラジオ -> 新: 幅/高さセレクタ（8刻み） */}
                        {editMode === "sprite" && (
                            <>
                                <label>幅</label>
                                <input
                                    type="number"
                                    value={activeTile.width}
                                    onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                                    step={8}
                                    min={8}
                                    // 任意で上限（例：128）
                                    max={8}
                                    style={{ width: 80 }}
                                />
                                <label>高さ</label>
                                <input
                                    type="number"
                                    value={activeTile.height}
                                    onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                                    step={8}
                                    min={8}
                                    max={16}
                                    style={{ width: 80 }}
                                />
                                <label>スプライト</label>
                                <input
                                    type="number"
                                    value={activeSprite}
                                    onChange={(e) => handleSpriteChange(e.target.value)}
                                    step={1}
                                    min={0}
                                    max={63}
                                    style={{ width: 80 }}
                                />
                            </>
                        )}

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
                )}
                <div>
                    <label>編集モード</label>
                    <select value={editMode} onChange={(e) => setEditMode(e.target.value as "screen" | "sprite")}>
                        <option value="screen">画面</option>
                        <option value="sprite">スプライト</option>
                    </select>
                </div>
                {editMode === "sprite" && (
                    <>
                        <div>
                            <label>パレット</label>
                            <select
                                value={activePalette}
                                onChange={(e) => setActivePalette(parseInt(e.target.value) as PaletteIndex)}
                            >
                                {palettes.map((_, i) => (
                                    <option key={i} value={i}>
                                        Palette {i}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div css={{ display: "flex", gap: 8 }}>
                            {palettes[activePalette].map((idx, j) => (
                                <>
                                    <SlotButton
                                        key={j}
                                        onClick={() => handlePaletteClick(j)}
                                        title={j === 0 ? "Slot 0: Transparent" : `Slot ${j}`}
                                        active={activeSlot === j}
                                        transparent={j === 0}
                                        bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                                    />
                                    <div>slot{j}</div>
                                </>
                            ))}
                        </div>
                    </>
                )}

                {editMode === "screen" && (
                    <>
                        {/* TODO: BGを描画する */}
                        <ScreenCanvas scale={5} showGrid={true} />
                    </>
                )}
                {editMode === "sprite" && (
                    <>
                        <SpriteCanvas
                            target={activeSprite}
                            scale={24}
                            showGrid={true}
                            tool={tool}
                            currentSelectPalette={activePalette as PaletteIndex}
                            activeColorIndex={activeSlot as ColorIndexOfPalette}
                            onChange={setTile}
                        />
                    </>
                )}

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
