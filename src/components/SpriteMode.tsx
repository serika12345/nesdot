// components/modes/SpriteMode.tsx
import React, { useState } from "react";
import { CanvasActions, Spacer, Toolbar, ToolButton } from "../App.styles";
import useExportImage from "../hooks/useExportImage";
import useImportImage from "../hooks/useImportImage";
import { NES_PALETTE_HEX } from "../nes/palette";
import {
    ColorIndexOfPalette,
    getHexArrayForSpriteTile,
    PaletteIndex,
    SpriteTile,
    SpriteTileND,
    useProjectState,
} from "../store/projectState";
import { makeTile, resizeTileND } from "../tiles/utils";
import { Tool } from "./hooks/useSpriteCanvas";
import { SlotButton } from "./PalettePicker.styles";
import { SpriteCanvas } from "./SpriteCanvas";

function makeEmptyTile(height: 8 | 16, paletteIndex: PaletteIndex): SpriteTile {
    return makeTile(height, 0, paletteIndex);
}

export const SpriteMode: React.FC = () => {
    const [tool, setTool] = useState<Tool>("pen");
    const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false); // 並べ替えモード
    const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
    const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1); // 0は透明スロット扱い
    const [activeSprite, setActiveSprite] = useState<number>(0);
    const activeTile = useProjectState((s) => s.sprites[activeSprite]);
    const palettes = useProjectState((s) => s.palettes);
    const sprites = useProjectState((s) => s.sprites);

    // ★ zustand の setState で部分更新
    const setTile = (t: SpriteTile, index: number) => {
        const newSprites = [...sprites];
        newSprites[index] = t;
        useProjectState.setState({ sprites: newSprites });
    };

    const handlePaletteClick = (slot: number) => {
        setActiveSlot(slot as ColorIndexOfPalette);
    };

    // スプライト高さ変更ハンドラ（非破壊版へ差し替え）
    const setHeight = (nextH: 8 | 16) => {
        if (Number.isNaN(nextH) || nextH < 8 || nextH % 8 !== 0) return;
        setTile(resizeTileND(activeTile as SpriteTileND, activeTile.width, nextH, { anchor: "top-left", fill: 0 }), activeSprite);
    };

    const handleSpriteChange = (index: string) => {
        const i = parseInt(index);
        setActiveSprite(i);
        const targetSprite = sprites[i];
        setActivePalette(targetSprite.paletteIndex);
    };

    const handlePaletteChange = (index: string) => {
        const i = parseInt(index);
        setActivePalette(i as PaletteIndex);
        const newTile = { ...activeTile, paletteIndex: i as PaletteIndex };
        setTile(newTile, activeSprite);
    };

    const projectState = useProjectState((s) => s);
    const { exportChr, exportPng, exportSvgSimple, exportJSON } = useExportImage();
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

    return (
        <>
            <Toolbar>
                {/* ★ 旧: 8x8/8x16 ラジオ -> 新: 幅/高さセレクタ（8刻み） */}
                <>
                    <ToolButton onClick={() => setHeight(8)} active={activeTile.height === 8}>
                        8×8
                    </ToolButton>
                    <ToolButton onClick={() => setHeight(16)} active={activeTile.height === 16}>
                        8×16
                    </ToolButton>

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

                <Spacer />
                {!isChangeOrderMode && (
                    <>
                        <ToolButton onClick={() => setTool("pen")} active={tool === "pen"}>
                            ペン
                        </ToolButton>
                        <ToolButton onClick={() => setTool("eraser")} active={tool === "eraser"}>
                            消しゴム
                        </ToolButton>
                        <ToolButton
                            onClick={() => {
                                if (confirm("本当にクリアしますか？")) {
                                    setTile(makeEmptyTile(activeTile.height, activeTile.paletteIndex), activeSprite);
                                }
                            }}
                        >
                            クリア
                        </ToolButton>
                        <ToolButton
                            onClick={() => {
                                setIsChangeOrderMode(true);
                            }}
                            active={isChangeOrderMode}
                        >
                            並べ替え
                        </ToolButton>
                    </>
                )}
                {isChangeOrderMode && (
                    <ToolButton
                        onClick={() => {
                            setIsChangeOrderMode(false);
                        }}
                        active={isChangeOrderMode}
                    >
                        並べ替え終了
                    </ToolButton>
                )}
            </Toolbar>

            <div>
                <label>パレット</label>
                <select value={activePalette} onChange={(e) => handlePaletteChange(e.target.value)}>
                    {palettes.map((_, i) => (
                        <option key={i} value={i}>
                            Palette {i}
                        </option>
                    ))}
                </select>
            </div>

            <div css={{ display: "flex", gap: 8 }}>
                {palettes[activePalette].map((idx, j) => (
                    <React.Fragment key={j}>
                        <SlotButton
                            onClick={() => handlePaletteClick(j)}
                            title={j === 0 ? "Slot 0: Transparent" : `Slot ${j}`}
                            active={activeSlot === j}
                            transparent={j === 0}
                            bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                        />
                        <div>slot{j}</div>
                    </React.Fragment>
                ))}
            </div>

            <SpriteCanvas
                isChangeOrderMode={isChangeOrderMode}
                target={activeSprite}
                scale={24}
                showGrid={true}
                tool={tool}
                currentSelectPalette={activePalette as PaletteIndex}
                activeColorIndex={activeSlot as ColorIndexOfPalette}
                onChange={setTile}
            />

            <CanvasActions>
                <button onClick={() => exportChr(activeTile, activePalette)}>CHRエクスポート</button>
                <button onClick={() => exportPng(getHexArrayForSpriteTile(activeTile))}>PNGエクスポート</button>
                <button onClick={() => exportSvgSimple(getHexArrayForSpriteTile(activeTile))}>SVGエクスポート</button>
                <button onClick={() => exportJSON(projectState)}>保存</button>
                <button onClick={handleImport}>復元</button>
            </CanvasActions>
        </>
    );
};
