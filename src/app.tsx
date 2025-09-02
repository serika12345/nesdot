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
import { Palette4, Pixel2bpp, ProjectState, SpriteTile } from "./nes/types";

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

const DEFAULT_STATE: ProjectState = {
    spriteSize: "8x8",
    palette: [0, 1, 21, 34], // 初期パレット（0=透明扱い）
    tile: makeEmptyTile(8),
};

export const App: React.FC = () => {
    const [state, setState] = useState<ProjectState>(DEFAULT_STATE);
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [activeIdx, setActiveIdx] = useState<Pixel2bpp>(1);

    const setPalette = (p: Palette4) => setState((s) => ({ ...s, palette: p }));
    const setTile = (t: SpriteTile) => setState((s) => ({ ...s, tile: t }));

    const setSpriteSize = (size: "8x8" | "8x16") => {
        setState((s) => {
            if (size === "8x8") {
                return { ...s, spriteSize: size, tile: makeEmptyTile(8) };
            } else {
                return { ...s, spriteSize: size, tile: makeEmptyTile(16) };
            }
        });
    };

    const exportChr = async () => {
        if (state.spriteSize === "8x8") {
            const bin = tile8x8ToChr({
                width: 8,
                height: 8,
                pixels: state.tile.pixels.slice(0, 8),
            });
            await saveBinary(bin, "sprite_8x8.chr");
        } else {
            const top = {
                width: 8,
                height: 8,
                pixels: state.tile.pixels.slice(0, 8),
            } as SpriteTile;
            const bottom = {
                width: 8,
                height: 8,
                pixels: state.tile.pixels.slice(8, 16),
            } as SpriteTile;
            const bin = tile8x16ToChr(top, bottom);
            await saveBinary(bin, "sprite_8x16.chr");
        }
    };

    const exportPng = async () => {
        // 簡易PNG出力：キャンバスをオフスクリーンで再描画してダウンロード
        const scale = 8;
        const w = 8 * scale;
        const h = (state.spriteSize === "8x8" ? 8 : 16) * scale;
        const cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        const ctx = cvs.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;

        // 透明はalpha=0、他はパレット色
        for (let y = 0; y < (state.spriteSize === "8x8" ? 8 : 16); y++) {
            for (let x = 0; x < 8; x++) {
                const v = state.tile.pixels[y][x];
                if (v === 0) {
                    // 透明
                    ctx.clearRect(x * scale, y * scale, scale, scale);
                } else {
                    ctx.fillStyle = NES_PALETTE_HEX[state.palette[v]];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        cvs.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, `sprite_${state.spriteSize}.png`);
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
                        <input type="radio" checked={state.spriteSize === "8x8"} onChange={() => setSpriteSize("8x8")} />
                        8×8
                    </label>
                    <label>
                        <input type="radio" checked={state.spriteSize === "8x16"} onChange={() => setSpriteSize("8x16")} />
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
                    {[1, 2, 3].map((i) => (
                        <ColorButton
                            key={i}
                            onClick={() => setActiveIdx(i as Pixel2bpp)}
                            title={`Palette Slot ${i}`}
                            active={activeIdx === i}
                            bg={NES_PALETTE_HEX[state.palette[i]]}
                        />
                    ))}
                    <TransparentButton onClick={() => setActiveIdx(0)} title="Transparent (erase)" active={activeIdx === 0} />
                </Toolbar>

                <PixelCanvas
                    tile={state.tile}
                    palette={state.palette}
                    scale={24}
                    showGrid
                    tool={tool}
                    activeColorIndex={activeIdx}
                    onChange={setTile}
                />

                <CanvasActions>
                    <button onClick={exportChr}>CHRエクスポート</button>
                    <button onClick={exportPng}>PNGエクスポート</button>
                    <button onClick={() => setTile(makeEmptyTile(state.spriteSize === "8x8" ? 8 : 16))}>クリア</button>
                </CanvasActions>
            </LeftPane>

            <RightPane>
                <H3>パレット</H3>
                <PalettePicker palette={state.palette} onChange={setPalette} />

                <div>
                    <H4>現在の4色</H4>
                    <CurrentColors>
                        {state.palette.map((idx, i) => (
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
