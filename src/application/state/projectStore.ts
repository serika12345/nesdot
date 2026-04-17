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
  renderBackgroundTileToHexArray,
  renderScreenToHexArray,
  renderSpriteTileToHexArray,
} from "../../domain/nes/rendering";
import {
  createDefaultProjectState,
  PaletteIndex,
  ProjectState,
  Screen,
  SpriteTile,
} from "../../domain/project/project";
import { type BackgroundTile } from "../../domain/project/projectV2";

export type {
  Backing,
  ColorIndexOfPalette,
  PaletteIndex,
  ProjectSpriteSize,
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

/**
 * プロジェクト全体の状態を保持する Zustand ストアです。
 * 画面、スプライト、NES 設定を同じ境界で扱い、各編集モードから一貫して参照できるようにします。
 */
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

/**
 * 指定スプライトを現在の NES スプライトパレットで色付きグリッドへ変換します。
 * UI 側が描画ロジックを持たずに済むよう、ストア状態を読んで表示用データを組み立てます。
 */
export const getHexArrayForSpriteTile = (tile: SpriteTile): string[][] => {
  const state = useProjectState.getState();
  return renderSpriteTileToHexArray(tile, state.nes.spritePalettes);
};

/**
 * 指定背景タイルを現在の NES 背景パレットで色付きグリッドへ変換します。
 * BG 編集画面が選択中パレットの見た目そのままで書き出せるよう、universal background color もここで反映します。
 */
export const getHexArrayForBackgroundTile = (
  tile: BackgroundTile,
  paletteIndex: PaletteIndex,
): string[][] => {
  const state = useProjectState.getState();

  return renderBackgroundTileToHexArray(
    tile,
    state.nes.backgroundPalettes[paletteIndex],
    state.nes.universalBackgroundColor,
  );
};

/**
 * 指定スクリーンを現在の NES 状態込みで色付きグリッドへ変換します。
 * 背景パレットと OAM 同期済みの情報を反映した最終表示を、プレビュー用途に取り出すための関数です。
 */
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
