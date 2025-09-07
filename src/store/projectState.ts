// store/project.ts
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, PersistOptions, StateStorage } from "zustand/middleware";
import { NES_PALETTE_HEX } from "../nes/palette";

export type ColorIndexOfPalette = 0 | 1 | 2 | 3;
export type PaletteIndex = 0 | 1 | 2 | 3;
export type NesColorIndex = number;
export type Palette4Colors = [NesColorIndex, NesColorIndex, NesColorIndex, NesColorIndex];
export type Palettes = [Palette4Colors, Palette4Colors, Palette4Colors, Palette4Colors];

export type SpriteInScreen = SpriteTile & { x: number; y: number; spriteIndex: number };

export type Screen = {
    width: 256;
    height: 240;
    backgroundTiles: BackgroundTile[][];
    sprites: SpriteInScreen[];
};

export interface SpriteTile {
    width: 8;
    height: 8 | 16; // 8の倍数であること
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
    screen: Screen;
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
    screen: {
        width: 256,
        height: 240,
        backgroundTiles: Array.from({ length: 30 }, () =>
            Array.from({ length: 32 }, () => ({
                width: 8,
                height: 8,
                paletteIndex: 0,
                pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0 as ColorIndexOfPalette)),
            }))
        ),
        sprites: [], // TODO: 64個まで登録できるようにする
    },
    // NES標準パレット（0は透明スロット扱い）
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

export const getHexArrayForSpriteTile = (tile: SpriteTile): string[][] => {
    return tile.pixels.map((row) => {
        return row.map((colorIndexOfPalette) => {
            const palette = useProjectState.getState().palettes[tile.paletteIndex];
            const nesColorIndex = palette[colorIndexOfPalette];
            return NES_PALETTE_HEX[nesColorIndex];
        });
    });
};

export const getHexArrayForScreen = (screen: Screen): string[][] => {
    // 256x240 の空配列を生成（hex文字列で満たす）
    const emptyLayer = (): string[][] =>
        Array.from({ length: screen.height }, () => Array.from({ length: screen.width }, () => NES_PALETTE_HEX[0]));

    const bgLayer = emptyLayer();
    const spriteLayer = emptyLayer();

    // --- BGレイヤの構築 ---
    // タイルは 32x30（各 8x8）なので、タイル座標→ピクセル座標へ展開
    for (let ty = 0; ty < screen.backgroundTiles.length; ty++) {
        const row = screen.backgroundTiles[ty];
        for (let tx = 0; tx < row.length; tx++) {
            const tile = row[tx];
            const palette = useProjectState.getState().palettes[tile.paletteIndex];
            const baseY = ty * 8;
            const baseX = tx * 8;

            for (let py = 0; py < 8; py++) {
                for (let px = 0; px < 8; px++) {
                    const ci = tile.pixels[py][px]; // ColorIndexOfPalette (0..3)
                    const nesIndex = palette[ci];
                    const hex = NES_PALETTE_HEX[nesIndex];
                    const y = baseY + py;
                    const x = baseX + px;
                    if (y >= 0 && y < screen.height && x >= 0 && x < screen.width) {
                        bgLayer[y][x] = hex;
                    }
                }
            }
        }
    }

    // --- スプライトレイヤの構築 ---
    // spriteIndex 昇順で描画（後から描いたものが上書き = 後勝ち）
    const spritesSorted = [...screen.sprites].sort((a, b) => a.spriteIndex - b.spriteIndex);

    for (const spr of spritesSorted) {
        const palette = useProjectState.getState().palettes[spr.paletteIndex];
        const w = spr.width; // 8
        const h = spr.height; // 8 or 16
        const baseX = spr.x | 0; // 負座標もクリップ対象にするため一応整数化
        const baseY = spr.y | 0;

        for (let py = 0; py < h; py++) {
            const row = spr.pixels[py];
            if (!row) continue;
            for (let px = 0; px < w; px++) {
                const ci = row[px];
                if (ci == null) continue;
                const nesIndex = palette[ci];
                const hex = NES_PALETTE_HEX[nesIndex];

                const x = baseX + px;
                const y = baseY + py;
                if (y < 0 || y >= screen.height || x < 0 || x >= screen.width) continue;

                // 透明色は書き込まない（後段のマージでBGを優先）
                if (hex !== NES_PALETTE_HEX[0]) {
                    spriteLayer[y][x] = hex;
                }
            }
        }
    }

    // --- マージ（透明色はBG優先） ---
    const out: string[][] = Array.from({ length: screen.height }, (_, y) =>
        Array.from({ length: screen.width }, (_, x) => {
            const sHex = spriteLayer[y][x];
            // スプライトが透明ならBG、そうでなければスプライト
            return sHex === NES_PALETTE_HEX[0] ? bgLayer[y][x] : sHex;
        })
    );

    return out;
};

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
