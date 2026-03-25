import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { tile8x16ToChr, tile8x8ToChr } from "../nes/chr";
import { NES_PALETTE_HEX } from "../nes/palette";
import {
  ColorIndexOfPalette,
  PaletteIndex,
  ProjectState,
  SpriteTile,
} from "../store/projectState";

type FileFilter = {
  name: string;
  extensions: string[];
};

type NativeSaveResult = "saved" | "cancelled" | "unavailable";

export default function useExportImage() {
  const blobToBytes = async (blob: Blob) =>
    new Uint8Array(await blob.arrayBuffer());

  const saveBytesNative = async (
    bytes: Uint8Array,
    defaultName: string,
    filters: FileFilter[],
  ): Promise<NativeSaveResult> => {
    try {
      const targetPath = await save({
        defaultPath: defaultName,
        filters,
      });
      const targetPathOption = O.fromNullable(targetPath);

      if (O.isNone(targetPathOption) || targetPathOption.value === "") {
        return "cancelled";
      }

      await writeFile(targetPathOption.value, bytes);
      return "saved";
    } catch {
      return "unavailable";
    }
  };

  // ★ CHR エクスポート：任意サイズは 8x8 タイル列として連結
  const exportChr = async (tile: SpriteTile, activePalette: PaletteIndex) => {
    const chunkResults = Array.from({ length: tile.height / 8 }, (_, blockY) =>
      Array.from({ length: tile.width / 8 }, (_, blockX) => {
        const ty = blockY * 8;
        const tx = blockX * 8;
        const subPixels: ColorIndexOfPalette[][] = Array.from(
          { length: 8 },
          (_, y) =>
            tile.pixels[ty + y].slice(tx, tx + 8) as ColorIndexOfPalette[],
        );
        return tile8x8ToChr({
          width: 8,
          height: 8,
          pixels: subPixels,
          paletteIndex: activePalette,
        });
      }),
    ).flat();
    const invalidChunk = chunkResults.find((chunk) => E.isLeft(chunk));
    if (invalidChunk && E.isLeft(invalidChunk)) {
      return;
    }
    const chunks = chunkResults
      .filter((chunk): chunk is E.Right<Uint8Array> => E.isRight(chunk))
      .map((chunk) => chunk.right);

    // 8x16 専用が必要なワークフロー向けに、幅==8 && 高さ==16のときだけ最適化（互換維持）
    if (tile.width === 8 && tile.height === 16) {
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
      if (E.isLeft(bin)) {
        return;
      }
      await saveBinary(bin.right, "sprite_8x16.chr", [
        { name: "CHR files", extensions: ["chr"] },
      ]);
      return;
    }

    const out = chunks.reduce((acc, chunk) => {
      const next = new Uint8Array(acc.length + chunk.length);
      next.set(acc, 0);
      next.set(chunk, acc.length);
      return next;
    }, new Uint8Array(0));
    await saveBinary(out, `sprite_${tile.width}x${tile.height}.chr`, [
      { name: "CHR files", extensions: ["chr"] },
    ]);
  };

  const exportPng = async (hexPixels: string[][], fileName?: string) => {
    // 簡易PNG出力：キャンバスをオフスクリーンで再描画してダウンロード
    const scale = 8;
    const h = hexPixels.length;
    const w = h > 0 ? hexPixels[0].length : 0;
    const cvs = document.createElement("canvas");
    cvs.width = w * scale;
    cvs.height = h * scale;
    const ctx = cvs.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    // 透明はalpha=0、他はパレット色
    Array.from({ length: h }, (_, y) => y).forEach((y) => {
      const row = hexPixels[y];
      Array.from({ length: w }, (_, x) => x).forEach((x) => {
        const hex = row[x];
        if (hex === NES_PALETTE_HEX[0]) {
          // 透明
          ctx.clearRect(x * scale, y * scale, scale, scale);
        } else {
          ctx.fillStyle = hex;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      });
    });
    const blob = await new Promise<Blob>((resolve, reject) => {
      cvs.toBlob((value) => {
        const valueOption = O.fromNullable(value);
        if (O.isNone(valueOption)) {
          reject(new Error("PNG blob generation failed"));
          return;
        }
        resolve(valueOption.value);
      }, "image/png");
    });

    const name = fileName ?? `image_${w}x${h}.png`;
    const saveResult = await saveBytesNative(await blobToBytes(blob), name, [
      { name: "PNG image", extensions: ["png"] },
    ]);
    if (saveResult === "unavailable") {
      downloadBlob(blob, name);
    }
  };

  // ▼追加：単純版SVG出力（1ピクセル＝1 rect）
  const exportSvgSimple = async (
    hexPixels: string[][],
    scale = 8,
    fileName?: string,
  ) => {
    const h = hexPixels.length;
    const w = h > 0 ? hexPixels[0].length : 0;

    const colorOf = (hex: string) => hex;

    const rects = Array.from({ length: h }, (_, y) => y)
      .flatMap((y) =>
        Array.from({ length: w }, (_, x) => x)
          .filter((x) => hexPixels[y][x] !== NES_PALETTE_HEX[0])
          .map(
            (x) =>
              `<rect x="${x}" y="${y}" width="1" height="1" fill="${colorOf(hexPixels[y][x])}"/>`,
          ),
      )
      .join("\n");

    const svg = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">`,
      rects,
      `</svg>`,
    ].join("\n");

    const name = fileName ?? `image_${w}x${h}.svg`;
    const bytes = new TextEncoder().encode(svg);
    const saveResult = await saveBytesNative(bytes, name, [
      { name: "SVG image", extensions: ["svg"] },
    ]);
    if (saveResult === "unavailable") {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      downloadBlob(blob, name);
    }
  };

  const saveBinary = async (
    data: Uint8Array,
    defaultName: string,
    filters: FileFilter[],
  ) => {
    // ★ ここを修正：ArrayBuffer バックの Uint8Array に正規化してから Blob を作る
    const arr = new Uint8Array(data); // copy; ensures ArrayBuffer (not SharedArrayBuffer)
    const saveResult = await saveBytesNative(arr, defaultName, filters);
    if (saveResult === "unavailable") {
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

  const exportJSON = async (projectState: ProjectState) => {
    const json = JSON.stringify(projectState);
    const fileName = "project.json";
    const bytes = new TextEncoder().encode(json);
    const saveResult = await saveBytesNative(bytes, fileName, [
      { name: "JSON file", extensions: ["json"] },
    ]);
    if (saveResult === "unavailable") {
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, fileName);
    }
  };

  return {
    exportChr,
    exportPng,
    exportSvgSimple,
    exportJSON,
  };
}
