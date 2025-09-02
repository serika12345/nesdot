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

// ★ 追加: zustand ストアを利用
// パスは実際の配置に合わせて調整してください

declare global {
    interface Window {
        api?: {
            saveBytes: (data: Uint8Array, defaultFileName: string) => Promise<void>;
        };
    }
}

function makeEmptyTile(height: 8 | 16): SpriteTile {
    const pixels: Pixel2bpp[][] = Array.from({ length: height }, () => Array.from({ length: 8 }, () => 0 as Pixel2bpp));
    return { width: 8, height, pixels };
}

export const App: React.FC = () => {
    // ★ App 内の ProjectState は zustand から取得
    const spriteSize = useProjectState((s) => s.spriteSize);
    const palette = useProjectState((s) => s.palette);
    const tile = useProjectState((s) => s.tile);

    // UI 用の一時状態はローカルで維持
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [activeIdx, setActiveIdx] = useState<Pixel2bpp>(1);

    // ★ zustand の setState で部分更新
    const setTile = (t: SpriteTile) => useProjectState.setState({ tile: t });

    const setSpriteSize = (size: "8x8" | "8x16") => {
        useProjectState.setState((s) => {
            if (size === "8x8") {
                return { ...s, spriteSize: size, tile: makeEmptyTile(8) };
            } else {
                return { ...s, spriteSize: size, tile: makeEmptyTile(16) };
            }
        });
    };

    const exportChr = async () => {
        if (spriteSize === "8x8") {
            const bin = tile8x8ToChr({
                width: 8,
                height: 8,
                pixels: tile.pixels.slice(0, 8),
            });
            await saveBinary(bin, "sprite_8x8.chr");
        } else {
            const top = {
                width: 8,
                height: 8,
                pixels: tile.pixels.slice(0, 8),
            } as SpriteTile;
            const bottom = {
                width: 8,
                height: 8,
                pixels: tile.pixels.slice(8, 16),
            } as SpriteTile;
            const bin = tile8x16ToChr(top, bottom);
            await saveBinary(bin, "sprite_8x16.chr");
        }
    };

    const exportPng = async () => {
        // 簡易PNG出力：キャンバスをオフスクリーンで再描画してダウンロード
        const scale = 8;
        const w = 8 * scale;
        const h = (spriteSize === "8x8" ? 8 : 16) * scale;
        const cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        const ctx = cvs.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;

        // 透明はalpha=0、他はパレット色
        for (let y = 0; y < (spriteSize === "8x8" ? 8 : 16); y++) {
            for (let x = 0; x < 8; x++) {
                const v = tile.pixels[y][x];
                if (v === 0) {
                    // 透明
                    ctx.clearRect(x * scale, y * scale, scale, scale);
                } else {
                    ctx.fillStyle = NES_PALETTE_HEX[palette[v]];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        cvs.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, `sprite_${spriteSize}.png`);
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
                    <label>
                        <input type="radio" checked={spriteSize === "8x8"} onChange={() => setSpriteSize("8x8")} />
                        8×8
                    </label>
                    <label>
                        <input type="radio" checked={spriteSize === "8x16"} onChange={() => setSpriteSize("8x16")} />
                        8×16
                    </label>

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
                    {[1, 2, 3].map((i) => (
                        <ColorButton
                            key={i}
                            onClick={() => setActiveIdx(i as Pixel2bpp)}
                            title={`Palette Slot ${i}`}
                            active={activeIdx === i}
                            bg={NES_PALETTE_HEX[palette[i]]}
                        />
                    ))}
                </Toolbar>

                <PixelCanvas tile={tile} scale={24} showGrid tool={tool} activeColorIndex={activeIdx} onChange={setTile} />

                <CanvasActions>
                    <button onClick={exportChr}>CHRエクスポート</button>
                    <button onClick={exportPng}>PNGエクスポート</button>
                    <button onClick={() => setTile(makeEmptyTile(spriteSize === "8x8" ? 8 : 16))}>クリア</button>
                </CanvasActions>
            </LeftPane>

            <RightPane>
                <H3>パレット</H3>
                <PalettePicker />

                <div>
                    <H4>現在の4色</H4>
                    <CurrentColors>
                        {palette.map((idx, i) => (
                            <SwatchWrap key={i}>
                                <Swatch transparent={i === 0} bg={i === 0 ? undefined : NES_PALETTE_HEX[idx]} />
                                <div>slot{i}</div>
                            </SwatchWrap>
                        ))}
                    </CurrentColors>
                    <SmallNote>NESスプライトは「4色パレット（うち1色は透明）」＋各ピクセルは0..3の2bitです。</SmallNote>
                </div>
            </RightPane>
        </Container>
    );
};

const root = createRoot(document.body);
root.render(<App />);
