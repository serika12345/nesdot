// store/project.ts
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  PersistOptions,
  StateStorage,
} from "zustand/middleware";
import {
  renderScreenToHexArray,
  renderSpriteTileToHexArray,
} from "../nes/rendering";
import {
  createDefaultNesProjectState,
  NesProjectState,
} from "./nesProjectState";

export type ColorIndexOfPalette = 0 | 1 | 2 | 3;
export type PaletteIndex = 0 | 1 | 2 | 3;
export type SpritePriority = "front" | "behindBg";

export type SpriteInScreen = SpriteTile & {
  x: number;
  y: number;
  spriteIndex: number;
  priority: SpritePriority;
  flipH: boolean;
  flipV: boolean;
};

export type Screen = {
  width: 256;
  height: 240;
  sprites: SpriteInScreen[];
};

export interface SpriteTile {
  width: 8;
  height: 8 | 16; // 8の倍数であること
  // ピクセル値は0..3（=パレット内インデックス）
  paletteIndex: PaletteIndex; // 0..3
  pixels: ColorIndexOfPalette[][];
}

// --- ここから追加: 非破壊リサイズ用の裏キャンバス付き拡張 ---
export type Backing = {
  pixels: ColorIndexOfPalette[][];
  width: number;
  height: number;
  // タイルの (0,0) が裏キャンバス上のどこに対応しているか
  offsetX: number;
  offsetY: number;
  fill: ColorIndexOfPalette;
};

// 既存 SpriteTile を拡張プロパティで拡張（型安全用の交差型）
export type SpriteTileND = SpriteTile & { __backing?: Backing };

export interface ProjectState {
  screen: Screen;
  sprites: SpriteTile[];
  nes: NesProjectState;
  // リハイドレート完了フラグ（UIのチラつき抑止用）
  _hydrated?: boolean;
}

function makeEmptyTile(height: 8 | 16): SpriteTile {
  const pixels: ColorIndexOfPalette[][] = Array.from({ length: height }, () =>
    Array.from({ length: 8 }, () => 0),
  );
  return { width: 8, height, pixels, paletteIndex: 0 };
}

const DEFAULT_STATE: ProjectState = {
  screen: {
    width: 256,
    height: 240,
    sprites: [],
  },
  sprites: Array.from({ length: 64 }, () => makeEmptyTile(8)),
  nes: createDefaultNesProjectState(),
  _hydrated: false,
};

const EMPTY_STORAGE_VALUE = ["nu", "ll"].join("");

// --- IndexedDB-backed Storage (string ベース) ---
const idbStorage: StateStorage = {
  getItem: async (name: string) => {
    const value: unknown = await idbGet(name);

    return pipe(
      O.fromNullable(value),
      O.match(
        () => EMPTY_STORAGE_VALUE,
        (stored) => `${stored}`,
      ),
    );
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

// --- persist オプション共通化 ---
const persistOptions: PersistOptions<ProjectState> = {
  name: "project-state", // IndexedDB のキー
  version: 1, // スキーマ変更時に上げる
  storage: createJSONStorage(() => idbStorage),
  // 必要に応じて永続化対象を絞る（全体保存ならコメントアウトのまま）
  // partialize: (state) => ({ nes: state.nes, sprites: state.sprites }),
  onRehydrateStorage: () => (state) => {
    // リハイドレート直前/直後のフック。マイグレーションや整合性チェックに使う。
    // 直後に _hydrated を立てて UI の初期化完了を通知
    const stateOption = O.fromNullable(state);
    if (O.isSome(stateOption)) {
      stateOption.value._hydrated = true;
    }
  },
};

export const useProjectState = create<ProjectState>()(
  // persist(
  //     (set) => ({
  //         ...DEFAULT_STATE,
  //     }),
  //     persistOptions
  // )
  () => ({
    ...DEFAULT_STATE,
  }),
);

export const getHexArrayForSpriteTile = (tile: SpriteTile): string[][] => {
  const state = useProjectState.getState();
  return renderSpriteTileToHexArray(tile, state.nes.spritePalettes);
};

export const getHexArrayForScreen = (screen: Screen): string[][] => {
  const state = useProjectState.getState();
  return renderScreenToHexArray(screen, state.nes);
};

// --- 終了/バックグラウンド時の明示フラッシュ（安全側） ---
// persist は set ごとに保存しますが、ウィンドウ終了タイミングで
// 未完了の I/O を取りこぼさないよう念のため追加します。
function flushNow() {
  const key = persistOptions.name ?? "project-state";
  const s = useProjectState.getState();
  // createJSONStorage が JSON.stringify 済みの文字列を要求するためここでも stringify
  const serialized = JSON.stringify({
    state: s,
    version: persistOptions.version ?? 0,
  });
  // 直接 idbStorage を叩いて確実に書く
  void idbStorage.setItem(key, serialized);
}

// ブラウザ/Tauri WebView のライフサイクルでフック
if ("window" in globalThis) {
  window.addEventListener("beforeunload", flushNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushNow();
  });
}
