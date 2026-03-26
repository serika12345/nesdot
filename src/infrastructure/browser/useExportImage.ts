import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import {
  CharacterJsonData,
  toCharacterJsonData,
  useCharacterState,
} from "../../application/state/characterStore";
import { tile8x16ToChr, tile8x8ToChr } from "../../domain/nes/chr";
import { nesIndexToCssHex } from "../../domain/nes/palette";
import {
  ColorIndexOfPalette,
  PaletteIndex,
  ProjectState,
  SpriteTile,
} from "../../domain/project/project";
import { getArrayItem, getMatrixItem } from "../../shared/arrayAccess";

type FileFilter = {
  name: string;
  extensions: string[];
};

type NativeSaveResult = "saved" | "cancelled" | "unavailable";

export default function useExportImage() {
  const blobToBytes = async (blob: Blob) =>
    new Uint8Array(await blob.arrayBuffer());

  const createFilledRow = (width: number): ColorIndexOfPalette[] =>
    Array.from({ length: width }, (): ColorIndexOfPalette => 0);

  const getSpriteRow = (
    pixels: ColorIndexOfPalette[][],
    rowIndex: number,
    width: number,
  ): ColorIndexOfPalette[] =>
    O.getOrElse(() => createFilledRow(width))(getArrayItem(pixels, rowIndex));

  const getHexGridWidth = (hexPixels: string[][]): number =>
    O.match(
      () => 0,
      (row: string[]) => row.length,
    )(getArrayItem(hexPixels, 0));

  const getHexPixel = (
    hexPixels: string[][],
    y: number,
    x: number,
  ): O.Option<string> => getMatrixItem(hexPixels, y, x);

  const parseHexToRgb = (
    hex: string,
  ): O.Option<{ r: number; g: number; b: number }> => {
    const normalizedOption = O.fromNullable(/^#([0-9A-Fa-f]{6})$/.exec(hex));
    if (O.isNone(normalizedOption)) {
      return O.none;
    }

    const rawOption = O.fromNullable(normalizedOption.value[1]);
    if (O.isNone(rawOption)) {
      return O.none;
    }
    const raw = rawOption.value;
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    return O.some({ r, g, b });
  };

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
            getSpriteRow(tile.pixels, ty + y, tile.width).slice(tx, tx + 8),
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
      const top: SpriteTile = {
        width: 8,
        height: 8,
        paletteIndex: activePalette,
        pixels: tile.pixels.slice(0, 8),
      };
      const bottom: SpriteTile = {
        width: 8,
        height: 8,
        paletteIndex: activePalette,
        pixels: tile.pixels.slice(8, 16),
      };
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
    const w = getHexGridWidth(hexPixels);
    const transparentHex = nesIndexToCssHex(0);
    const cvs = document.createElement("canvas");
    const scaledWidth = w * scale;
    const scaledHeight = h * scale;
    cvs.setAttribute("width", `${scaledWidth}`);
    cvs.setAttribute("height", `${scaledHeight}`);
    const ctxOption = O.fromNullable(cvs.getContext("2d"));
    if (O.isNone(ctxOption)) {
      return;
    }
    const ctx = ctxOption.value;

    const rgbaValues = Array.from({ length: scaledHeight }, (_, yy) => {
      const y = Math.floor(yy / scale);
      return Array.from({ length: scaledWidth }, (_, xx) => {
        const x = Math.floor(xx / scale);
        const hexOption = getHexPixel(hexPixels, y, x);
        if (O.isNone(hexOption) || hexOption.value === transparentHex) {
          return [0, 0, 0, 0];
        }

        const rgbOption = parseHexToRgb(hexOption.value);
        if (O.isNone(rgbOption)) {
          return [0, 0, 0, 0];
        }
        return [rgbOption.value.r, rgbOption.value.g, rgbOption.value.b, 255];
      }).flat();
    }).flat();

    const imageData = new ImageData(
      Uint8ClampedArray.from(rgbaValues),
      scaledWidth,
      scaledHeight,
    );
    ctx.putImageData(imageData, 0, 0);
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
    const w = getHexGridWidth(hexPixels);
    const transparentHex = nesIndexToCssHex(0);

    const colorOf = (hex: string) => hex;

    const rects = Array.from({ length: h }, (_, y) => y)
      .flatMap((y) =>
        Array.from({ length: w }, (_, x) => x)
          .map((x) => {
            const hexOption = getHexPixel(hexPixels, y, x);
            if (O.isNone(hexOption) || hexOption.value === transparentHex) {
              return "";
            }

            return `<rect x="${x}" y="${y}" width="1" height="1" fill="${colorOf(hexOption.value)}"/>`;
          })
          .filter((line) => line !== ""),
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
    a.setAttribute("href", url);
    a.setAttribute("download", fileName);
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = async (
    projectState: ProjectState & { _hydrated?: boolean },
  ) => {
    const characterJson = toCharacterJsonData({
      characterSets: useCharacterState.getState().characterSets,
      selectedCharacterId: useCharacterState.getState().selectedCharacterId,
    });
    const exportedProjectState: ProjectState = {
      spriteSize: projectState.spriteSize,
      screen: projectState.screen,
      sprites: projectState.sprites,
      nes: projectState.nes,
    };
    const json = JSON.stringify({
      ...exportedProjectState,
      characters: characterJson,
    });
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

  const exportCharacterJson = async (
    characterData: CharacterJsonData,
    fileName = "character.json",
  ) => {
    const json = JSON.stringify(characterData);
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
    exportCharacterJson,
  };
}
