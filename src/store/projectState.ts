// store/project.ts
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, PersistOptions, StateStorage } from "zustand/middleware";

export type ColorIndexOfPalette = 0 | 1 | 2 | 3;
export type PaletteIndex = 0 | 1 | 2 | 3;
export type NesColorIndex = number;
export type Palette4Colors = [NesColorIndex, NesColorIndex, NesColorIndex, NesColorIndex];
export type Palettes = [Palette4Colors, Palette4Colors, Palette4Colors, Palette4Colors];

type SpriteSize = "8x8" | "8x16"; // 今は使ってない

type ScreenWidth = 256;
type ScreenHeight = 240;

export type Screen = {
    width: ScreenWidth;
    height: ScreenHeight;
    backgroundTiles: BackgroundTile[][];
};

export interface SpriteTile {
    width: number; // 8の倍数であること
    height: number; // 8の倍数であること
    spriteSize?: SpriteSize; // 8x8 or 8x16 TODO: スプライト毎の編集→キャンバスに統合させるのでこれを参照する
    // ピクセル値は0..3（=パレット内インデックス）
    paletteIndex: PaletteIndex; // 0..3
    pixels: ColorIndexOfPalette[][];
}

export interface BackgroundTile {
    width: 8;
    height: 8;
    paletteIndex: PaletteIndex;
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
    palettes: Palettes;
    sprites: SpriteTile[]; // スプライトシート用 TODO: 別で作成したこれをキャンバスに配置できるようにする。
    // リハイドレート完了フラグ（UIのチラつき抑止用）
    _hydrated?: boolean;
}

function makeEmptyTile(height: 8 | 16): SpriteTile {
    const pixels: ColorIndexOfPalette[][] = Array.from({ length: height }, () =>
        Array.from({ length: 8 }, () => 0 as ColorIndexOfPalette)
    );
    return { width: 8, height, pixels, paletteIndex: 0 };
}

const DEFAULT_STATE: ProjectState = {
    palettes: [
        [0, 1, 21, 34],
        [0, 1, 21, 34],
        [0, 1, 21, 34],
        [0, 1, 21, 34],
    ],
    sprites: (() => {
        const length = 64;
        const arr: SpriteTile[] = [];
        for (let i = 0; i < length; i++) {
            arr.push(makeEmptyTile(8));
        }
        return arr;
    })(),
    _hydrated: false,
};

// --- IndexedDB-backed Storage (string ベース) ---
const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const v = await idbGet(name);
        return typeof v === "string" ? v : v == null ? null : JSON.stringify(v);
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
    // partialize: (state) => ({ palettes: state.palettes, tile: state.tile }),
    onRehydrateStorage: () => (state) => {
        // リハイドレート直前/直後のフック。マイグレーションや整合性チェックに使う。
        // 直後に _hydrated を立てて UI の初期化完了を通知
        if (state) state._hydrated = true;
    },
};

export const useProjectState = create<ProjectState>()(
    // persist(
    //     (set) => ({
    //         ...DEFAULT_STATE,
    //     }),
    //     persistOptions
    // )
    (set) => ({
        ...DEFAULT_STATE,
    })
);

// --- 終了/バックグラウンド時の明示フラッシュ（安全側） ---
// persist は set ごとに保存しますが、Electron の終了タイミングで
// 未完了の I/O を取りこぼさないよう念のため追加します。
function flushNow() {
    const key = persistOptions.name!;
    const s = useProjectState.getState();
    // createJSONStorage が JSON.stringify 済みの文字列を要求するためここでも stringify
    const serialized = JSON.stringify({ state: s, version: persistOptions.version ?? 0 });
    // 直接 idbStorage を叩いて確実に書く
    void idbStorage.setItem(key, serialized);
}

// ブラウザ/Electron レンダラーのライフサイクルでフック
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", flushNow);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushNow();
    });
}

// --- （任意）メインプロセスから終了通知を受けてフラッシュしたい場合 ---
// preload.ts で contextBridge.exposeInMainWorld("appEvents", { onBeforeQuit(cb) { ipcRenderer.on("app-before-quit", cb) } })
// し、ここで window.appEvents?.onBeforeQuit(() => flushNow());
