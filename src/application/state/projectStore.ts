import { create } from "zustand";
import {
  renderBackgroundTileToHexArray,
  renderProjectStateV2ToHexArray,
  renderSpriteTileToHexArray,
} from "../../domain/nes/rendering";
import { buildNesProjection } from "../../domain/nes/projection";
import type { NesProjectState } from "../../domain/nes/nesProject";
import {
  type PaletteIndex,
  type SpriteTile,
} from "../../domain/project/project";
import {
  createDefaultProjectStateV2,
  type BackgroundTile,
  type ProjectStateV2,
} from "../../domain/project/projectV2";

export type {
  ColorIndexOfPalette,
  PaletteIndex,
  ProjectSpriteSize,
  SpriteInScreen,
  SpritePriority,
  SpriteTile,
} from "../../domain/project/project";
export type {
  BackgroundTile,
  ProjectStateV2,
  ScreenBackground,
} from "../../domain/project/projectV2";

export type Screen = ProjectStateV2["screen"];

export type ProjectStoreState = ProjectStateV2;

/**
 * プロジェクト全体の状態を保持する Zustand ストアです。
 * 正規化済み v2 project state を正本にし、NES raw state は projection として導出します。
 */
export const useProjectState = create<ProjectStoreState>()(() =>
  createDefaultProjectStateV2(),
);

/**
 * 指定スプライトを現在の NES スプライトパレットで色付きグリッドへ変換します。
 * UI 側が描画ロジックを持たずに済むよう、ストア状態を読んで表示用データを組み立てます。
 */
export const getHexArrayForSpriteTile = (tile: SpriteTile): string[][] => {
  const state = useProjectState.getState();
  return renderSpriteTileToHexArray(tile, state.palettes.sprite);
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
    state.palettes.background[paletteIndex],
    state.palettes.universalBackgroundColor,
  );
};

/**
 * 指定スクリーンを現在の NES 状態込みで色付きグリッドへ変換します。
 * 背景パレットと OAM 同期済みの情報を反映した最終表示を、プレビュー用途に取り出すための関数です。
 */
export const getHexArrayForScreen = (screen: Screen): string[][] => {
  const state = useProjectState.getState();
  return renderProjectStateV2ToHexArray({
    ...state,
    screen,
  });
};

export const getNesProjectionForProject = (
  projectState: ProjectStoreState = useProjectState.getState(),
): NesProjectState => buildNesProjection(projectState);
