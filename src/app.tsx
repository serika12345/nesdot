// App.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
    CanvasActions,
    ColorButton,
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
    TransparentButton,
} from "./App.styles";
import { PalettePicker } from "./components/PalettePicker";
import { PixelCanvas } from "./components/PixelCanvas";
import { tile8x16ToChr, tile8x8ToChr } from "./nes/chr";
import { NES_PALETTE_HEX } from "./nes/palette";
import { Pixel2bpp, SpriteTile, useProjectState } from "./store/projectState";

// ★ 追加: 任意サイズ対応ユーティリティ
import { makeTile, resizeTile } from "./tiles/utils";

declare global {
    interface Window {
        api?: {
            saveBytes: (data: Uint8Array, defaultFileName: string) => Promise<void>;
        };
    }
}

// ★ makeEmptyTile は任意サイズ対応（既定8x8）
function makeEmptyTile(width = 8, height = 8): SpriteTile {
    return makeTile(width, height, 0);
}

export const App: React.FC = () => {
    // ★ App 内の ProjectState は zustand から取得
    // もともとの spriteSize は廃止し、tile.width/height を真実のソースにします
    const palettes = useProjectState((s) => s.palettes);
    const currentSelectPalette = useProjectState((s) => s.currentSelectPalette);
    const tile = useProjectState((s) => s.tile);

    // UI 用の一時状態はローカルで維持
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [activeIdx, setActiveIdx] = useState<Pixel2bpp>(1);

    // ★ zustand の setState で部分更新
    const setTile = (t: SpriteTile) => useProjectState.setState({ tile: t });

    // ★ 幅・高さ入力（8刻み）ハンドラ
    const setWidth = (nextW: number) => {
        if (Number.isNaN(nextW) || nextW < 8 || nextW % 8 !== 0) return;
        setTile(resizeTile(tile, nextW, tile.height, { anchor: "top-left", fill: 0 }));
    };
    const setHeight = (nextH: number) => {
        if (Number.isNaN(nextH) || nextH < 8 || nextH % 8 !== 0) return;
        setTile(resizeTile(tile, tile.width, nextH, { anchor: "top-left", fill: 0 }));
    };

    // ★ CHR エクスポート：任意サイズは 8x8 タイル列として連結
    const exportChr = async () => {
        const chunks: Uint8Array[] = [];
        for (let ty = 0; ty < tile.height; ty += 8) {
            for (let tx = 0; tx < tile.width; tx += 8) {
                // 8x8 サブタイルを切り出し
                const subPixels: Pixel2bpp[][] = [];
                for (let y = 0; y < 8; y++) {
                    subPixels.push(tile.pixels[ty + y].slice(tx, tx + 8) as Pixel2bpp[]);
                }
                const bin = tile8x8ToChr({ width: 8, height: 8, pixels: subPixels });
                chunks.push(bin);
            }
        }
        // 8x16 専用が必要なワークフロー向けに、幅==8 && 高さ==16のときだけ最適化（互換維持）
        if (tile.width === 8 && tile.height === 16) {
            const top = { width: 8, height: 8, pixels: tile.pixels.slice(0, 8) } as SpriteTile;
            const bottom = { width: 8, height: 8, pixels: tile.pixels.slice(8, 16) } as SpriteTile;
            const bin = tile8x16ToChr(top, bottom);
            await saveBinary(bin, "sprite_8x16.chr");
            return;
        }

        const total = chunks.reduce((a, c) => a + c.length, 0);
        const out = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.length;
        }
        await saveBinary(out, `sprite_${tile.width}x${tile.height}.chr`);
    };

    const exportPng = async () => {
        // 簡易PNG出力：キャンバスをオフスクリーンで再描画してダウンロード
        const scale = 8;
        const w = tile.width * scale;
        const h = tile.height * scale;
        const cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        const ctx = cvs.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;

        // 透明はalpha=0、他はパレット色
        for (let y = 0; y < tile.height; y++) {
            for (let x = 0; x < tile.width; x++) {
                const v = tile.pixels[y][x];
                if (v === 0) {
                    // 透明
                    ctx.clearRect(x * scale, y * scale, scale, scale);
                } else {
                    ctx.fillStyle = NES_PALETTE_HEX[palettes[currentSelectPalette][v]];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        cvs.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, `sprite_${tile.width}x${tile.height}.png`);
        }, "image/png");
    };

    const saveBinary = async (data: Uint8Array, defaultName: string) => {
        if (window.api?.saveBytes) {
            await window.api.saveBytes(data, defaultName);
        } else {
            // ★ ここを修正：ArrayBuffer バックの Uint8Array に正規化してから Blob を作る
            const arr = new Uint8Array(data); // copy; ensures ArrayBuffer (not SharedArrayBuffer)
            const blob = new Blob([arr], { type: "application/octet-stream" });
            downloadBlob(blob, defaultName);
        }
    };

    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
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

                    <Spacer />

                    <label>描画色:</label>
                    <TransparentButton onClick={() => setActiveIdx(0)} title="Transparent (erase)" active={activeIdx === 0} />
                    <div>slot{0}</div>
                    {[1, 2, 3].map((i) => (
                        <>
                            <ColorButton
                                key={i}
                                onClick={() => setActiveIdx(i as Pixel2bpp)}
                                title={`Palette Slot ${i}`}
                                active={activeIdx === i}
                                bg={NES_PALETTE_HEX[palettes[currentSelectPalette][i]]} // TODO: 切り替えられるようにする
                            />
                            <div>slot{i}</div>
                        </>
                    ))}
                </Toolbar>

                <PixelCanvas scale={24} showGrid={true} tool={tool} activeColorIndex={activeIdx} onChange={setTile} />

                <CanvasActions>
                    <button onClick={exportChr}>CHRエクスポート</button>
                    <button onClick={exportPng}>PNGエクスポート</button>
                    <button onClick={() => setTile(makeEmptyTile(tile.width, tile.height))}>クリア</button>
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
