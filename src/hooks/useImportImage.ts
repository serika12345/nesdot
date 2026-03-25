import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import * as O from "fp-ts/Option";
import { ProjectState } from "../store/projectState";

const isIntegerInRange = (value: unknown, min: number, max: number): boolean =>
  Number.isInteger(value) && Number(value) >= min && Number(value) <= max;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

const isPixels = (value: unknown, width: number, height: number): boolean =>
  Array.isArray(value) &&
  value.length === height &&
  value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === width &&
      row.every((cell) => isIntegerInRange(cell, 0, 3)),
  );

const isSpriteTile = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const width = value.width;
  const height = value.height;
  const paletteIndex = value.paletteIndex;
  const pixels = value.pixels;

  const isValidHeight = height === 8 || height === 16;

  return (
    width === 8 &&
    isValidHeight &&
    isIntegerInRange(paletteIndex, 0, 3) &&
    isPixels(pixels, 8, Number(height))
  );
};

const isBackgroundTile = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    value.width === 8 &&
    value.height === 8 &&
    isIntegerInRange(value.paletteIndex, 0, 3) &&
    isPixels(value.pixels, 8, 8)
  );
};

const isSpriteInScreen = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    isSpriteTile(value) &&
    Number.isInteger(value.x) &&
    Number.isInteger(value.y) &&
    Number.isInteger(value.spriteIndex)
  );
};

const isScreen = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const backgroundTiles = value.backgroundTiles;
  const sprites = value.sprites;

  return (
    value.width === 256 &&
    value.height === 240 &&
    Array.isArray(backgroundTiles) &&
    backgroundTiles.every(
      (row) =>
        Array.isArray(row) && row.every((tile) => isBackgroundTile(tile)),
    ) &&
    Array.isArray(sprites) &&
    sprites.every((sprite) => isSpriteInScreen(sprite))
  );
};

const isPalette4Colors = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every((entry) => isIntegerInRange(entry, 0, 63));

const isPalettes = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every((palette) => isPalette4Colors(palette));

const isProjectState = (value: unknown): value is ProjectState => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const screen = value.screen;
  const palettes = value.palettes;
  const sprites = value.sprites;

  return (
    isScreen(screen) &&
    isPalettes(palettes) &&
    Array.isArray(sprites) &&
    sprites.length === 64 &&
    sprites.every((sprite) => isSpriteTile(sprite))
  );
};

const parseProjectState = (text: string): O.Option<ProjectState> => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (isProjectState(parsed)) {
      return O.some(parsed);
    }
    return O.none;
  } catch {
    return O.none;
  }
};

type NativeImportResult =
  | { status: "selected"; text: string }
  | { status: "cancelled" }
  | { status: "unavailable" };

export default function useImportImage() {
  const noopInputHandler = () => {};

  const readJsonWithNativeDialog = async (): Promise<NativeImportResult> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "JSON file", extensions: ["json"] }],
      });
      const selectedOption = O.fromNullable(selected);

      if (O.isNone(selectedOption)) {
        return { status: "cancelled" };
      }
      const selectedValue = selectedOption.value;

      if (selectedValue === "") {
        return { status: "cancelled" };
      }

      if (Array.isArray(selectedValue)) {
        if (selectedValue[0] === "") {
          return { status: "cancelled" };
        }

        return {
          status: "selected",
          text: await readTextFile(selectedValue[0]),
        };
      }

      return { status: "selected", text: await readTextFile(selectedValue) };
    } catch {
      return { status: "unavailable" };
    }
  };

  const readJsonWithInputFallback = async (): Promise<O.Option<string>> => {
    return new Promise<O.Option<string>>((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.style.display = "none";
      document.body.appendChild(input);

      const cleanup = () => {
        input.onchange = noopInputHandler;
        input.oncancel = noopInputHandler;
        document.body.removeChild(input);
      };

      input.onchange = async (e) => {
        void e;
        const fileOption = O.fromNullable(input.files?.[0]);
        if (O.isNone(fileOption)) {
          cleanup();
          resolve(O.none);
          return;
        }
        const file = fileOption.value;

        try {
          resolve(O.some(await file.text()));
        } catch (err) {
          reject(err);
        } finally {
          cleanup();
        }
      };

      input.oncancel = () => {
        cleanup();
        resolve(O.none);
      };

      input.click();
    });
  };

  const importJSON = async (
    onImport: (data: ProjectState) => void,
  ): Promise<boolean> => {
    const nativeResult = await readJsonWithNativeDialog();

    if (nativeResult.status === "selected") {
      const parsedOption = parseProjectState(nativeResult.text);
      if (O.isNone(parsedOption)) {
        alert("JSON の形式が不正です。インポートを中止しました。");
        return false;
      }
      onImport(parsedOption.value);
      return true;
    }

    if (nativeResult.status === "cancelled") {
      return false;
    }

    const fallbackText = await readJsonWithInputFallback();
    if (O.isNone(fallbackText)) {
      return false;
    }

    const parsedOption = parseProjectState(fallbackText.value);
    if (O.isNone(parsedOption)) {
      alert("JSON の形式が不正です。インポートを中止しました。");
      return false;
    }
    onImport(parsedOption.value);
    return true;
  };

  return { importJSON };
}
