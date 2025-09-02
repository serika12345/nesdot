import React from "react";
import { createRoot } from "react-dom/client";
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
    const [state, setState] = React.useState<ProjectState>(DEFAULT_STATE);
    const [tool, setTool] = React.useState<"pen" | "eraser">("pen");
    const [activeIdx, setActiveIdx] = React.useState<Pixel2bpp>(1);

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
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "auto 320px",
                gap: 16,
                padding: 16,
                fontFamily: "ui-sans-serif, system-ui",
            }}
        >
            <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <label>
                        <input type="radio" checked={state.spriteSize === "8x8"} onChange={() => setSpriteSize("8x8")} />
                        8×8
                    </label>
                    <label>
                        <input type="radio" checked={state.spriteSize === "8x16"} onChange={() => setSpriteSize("8x16")} />
                        8×16
                    </label>
                    <div style={{ width: 24 }} />
                    <button
                        onClick={() => setTool("pen")}
                        style={{ padding: "4px 8px", border: tool === "pen" ? "2px solid #333" : "1px solid #aaa" }}
                    >
                        ペン
                    </button>
                    <button
                        onClick={() => setTool("eraser")}
                        style={{ padding: "4px 8px", border: tool === "eraser" ? "2px solid #333" : "1px solid #aaa" }}
                    >
                        消しゴム
                    </button>
                    <div style={{ width: 24 }} />
                    <label>描画色:</label>
                    {[1, 2, 3].map((i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIdx(i as Pixel2bpp)}
                            title={`Palette Slot ${i}`}
                            style={{
                                width: 28,
                                height: 28,
                                border: activeIdx === i ? "3px solid #333" : "1px solid #aaa",
                                background: NES_PALETTE_HEX[state.palette[i]],
                                cursor: "pointer",
                            }}
                        />
                    ))}
                    <button
                        onClick={() => setActiveIdx(0)}
                        title="Transparent (erase)"
                        style={{
                            width: 28,
                            height: 28,
                            cursor: "pointer",
                            border: activeIdx === 0 ? "3px solid #333" : "1px solid #aaa",
                            background: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)",
                            backgroundSize: "8px 8px",
                        }}
                    />
                </div>

                <PixelCanvas
                    tile={state.tile}
                    palette={state.palette}
                    scale={24}
                    showGrid
                    tool={tool}
                    activeColorIndex={activeIdx}
                    onChange={setTile}
                />

                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={exportChr}>CHRエクスポート</button>
                    <button onClick={exportPng}>PNGエクスポート</button>
                    <button onClick={() => setTile(makeEmptyTile(state.spriteSize === "8x8" ? 8 : 16))}>クリア</button>
                </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0 }}>パレット</h3>
                <PalettePicker palette={state.palette} onChange={setPalette} />
                <div>
                    <h4 style={{ margin: "8px 0 4px" }}>現在の4色</h4>
                    <div style={{ display: "flex", gap: 8 }}>
                        {state.palette.map((idx, i) => (
                            <div key={i} style={{ textAlign: "center", fontSize: 12 }}>
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        background:
                                            i === 0 ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)" : NES_PALETTE_HEX[idx],
                                        border: "1px solid #00000022",
                                        backgroundSize: i === 0 ? "8px 8px" : undefined,
                                    }}
                                />
                                <div>slot{i}</div>
                            </div>
                        ))}
                    </div>
                    <small style={{ color: "#555" }}>
                        NESスプライトは「4色パレット（うち1色は透明）」＋各ピクセルは0..3の2bitです。
                    </small>
                </div>
            </div>
        </div>
    );
};

const root = createRoot(document.body);
root.render(<App />);
