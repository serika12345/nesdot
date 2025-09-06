import { tile8x16ToChr, tile8x8ToChr } from "../nes/chr";
import { NES_PALETTE_HEX } from "../nes/palette";
import { ColorIndexOfPalette, PaletteIndex, ProjectState, SpriteTile } from "../store/projectState";

export default function useExportImage() {
    // ★ CHR エクスポート：任意サイズは 8x8 タイル列として連結
    const exportChr = async (tile: SpriteTile, activePalette: PaletteIndex) => {
        const chunks: Uint8Array[] = [];
        for (let ty = 0; ty < tile.height; ty += 8) {
            for (let tx = 0; tx < tile.width; tx += 8) {
                // 8x8 サブタイルを切り出し
                const subPixels: ColorIndexOfPalette[][] = [];
                for (let y = 0; y < 8; y++) {
                    subPixels.push(tile.pixels[ty + y].slice(tx, tx + 8) as ColorIndexOfPalette[]);
                }
                const bin = tile8x8ToChr({ width: 8, height: 8, pixels: subPixels, paletteIndex: activePalette });
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

    const exportPng = async (tile: SpriteTile) => {
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
                    ctx.fillStyle = NES_PALETTE_HEX[v];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        cvs.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, `sprite_${tile.width}x${tile.height}.png`);
        }, "image/png");
    };

    // ▼追加：単純版SVG出力（1ピクセル＝1 rect）
    const exportSvgSimple = (tile: SpriteTile, scale = 8) => {
        const w = tile.width;
        const h = tile.height;

        // 必要に応じてパレットガード
        const colorOf = (idx: number) => {
            const c = NES_PALETTE_HEX[idx];
            return typeof c === "string" ? c : "#000";
        };

        // XML宣言は必須ではありませんが、互換性のため付けておきます
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">\n`;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const v = tile.pixels[y][x];
                if (v === 0) continue; // 透明は出力しない
                svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colorOf(v)}"/>\n`;
            }
        }

        svg += `</svg>`;

        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `sprite_${w}x${h}.svg`);
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

    const exportJSON = (projectState: ProjectState) => {
        const json = JSON.stringify(projectState);
        const blob = new Blob([json], { type: "application/json;charset=utf-8" });
        downloadBlob(blob, "project.json");
    };

    return {
        exportChr,
        exportPng,
        exportSvgSimple,
        exportJSON,
    };
}
