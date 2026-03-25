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
} from "../../domain/nes/rendering";
import {
  ProjectState,
  Screen,
  SpriteTile,
  createDefaultProjectState,
} from "../../domain/project/project";

export type {
  Backing,
  ColorIndexOfPalette,
  PaletteIndex,
  ProjectState,
  Screen,
  SpriteInScreen,
  SpritePriority,
  SpriteTile,
  SpriteTileND,
} from "../../domain/project/project";

export interface ProjectStoreState extends ProjectState {
  _hydrated?: boolean;
}

const DEFAULT_STATE: ProjectStoreState = {
  ...createDefaultProjectState(),
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
const persistOptions: PersistOptions<ProjectStoreState> = {
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
      useProjectState.setState((prev) => ({
        ...prev,
        _hydrated: true,
      }));
    }
  },
};

export const useProjectState = create<ProjectStoreState>()(
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
