import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  analyzeCharacterDecomposition,
  type CharacterDecompositionAnalysis,
  type CharacterDecompositionCanvas,
  type CharacterDecompositionRegion,
  type CharacterDecompositionRegionAnalysis,
} from "../../../../domain/characters/characterDecomposition";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import { type SpriteTile } from "../../../../domain/project/project";
import { type DecompositionTool } from "../ui/primitives/CharacterModePrimitives";
import { type CharacterModeSelectedSpriteStageMetadata } from "./characterModeStateTypes";
import {
  ensureSelectedCharacterSpriteIndex,
  resolveCharacterStageScale,
} from "./model/characterEditorModel";
import { isProjectSpriteSizeLocked } from "./project/projectSpriteSizeLock";
import {
  type DecompositionRegionContextMenuState,
  type LibraryDragState,
} from "./types/characterModeInteractionState";
import { type CharacterEditorMode } from "./view/characterEditorMode";

// ---------------------------------------------------------------------------
// Pure selectors — each is a standalone pure function
// ---------------------------------------------------------------------------

/**
 * 選択中キャラクターセットを characterSets と selectedCharacterId から導出します。
 */
export const selectActiveSet = (
  characterSets: ReadonlyArray<CharacterSet>,
  selectedCharacterId: O.Option<string>,
): O.Option<CharacterSet> =>
  pipe(
    selectedCharacterId,
    O.chain((id) => O.fromNullable(characterSets.find((cs) => cs.id === id))),
  );

export const selectActiveSetId = (activeSet: O.Option<CharacterSet>): string =>
  pipe(
    activeSet,
    O.match(
      () => "",
      (cs) => cs.id,
    ),
  );

export const selectActiveSetName = (
  activeSet: O.Option<CharacterSet>,
): string =>
  pipe(
    activeSet,
    O.match(
      () => "",
      (cs) => cs.name,
    ),
  );

export const selectActiveSetSpriteCount = (
  activeSet: O.Option<CharacterSet>,
): number =>
  pipe(
    activeSet,
    O.match(
      () => 0,
      (cs) => cs.sprites.length,
    ),
  );

/**
 * ステージ寸法とズームからスケール倍率を導出します。
 */
export const selectStageScale = (
  stageWidth: number,
  stageHeight: number,
  stageZoomLevel: number,
): number =>
  resolveCharacterStageScale(stageWidth, stageHeight, stageZoomLevel);

/**
 * スプライトサイズ変更をロックすべきかを判定します。
 */
export const selectProjectSpriteSizeLocked = (
  sprites: ReadonlyArray<SpriteTile>,
  screenSpriteCount: number,
  characterSets: ReadonlyArray<CharacterSet>,
): boolean =>
  isProjectSpriteSizeLocked([...sprites], screenSpriteCount, [
    ...characterSets,
  ]);

/**
 * ライブラリドラッグがステージ上にあるかを判定します。
 */
export const selectIsStageDropActive = (
  libraryDragState: O.Option<LibraryDragState>,
): boolean =>
  pipe(
    libraryDragState,
    O.match(
      () => false,
      (drag) => drag.isOverStage,
    ),
  );

/**
 * ライブラリからドラッグ可能かを判定します。
 */
export const selectIsLibraryDraggable = (
  editorMode: CharacterEditorMode,
  activeSet: O.Option<CharacterSet>,
): boolean => editorMode === "compose" && O.isSome(activeSet);

/**
 * 選択中スプライトのステージ表示メタデータを導出します。
 */
export const selectSelectedSpriteStageMetadata = (
  activeSet: O.Option<CharacterSet>,
  selectedSpriteEditorIndex: O.Option<number>,
): CharacterModeSelectedSpriteStageMetadata =>
  pipe(
    activeSet,
    O.chain((cs) =>
      pipe(
        ensureSelectedCharacterSpriteIndex(
          selectedSpriteEditorIndex,
          cs.sprites.length,
        ),
        O.chain((index) =>
          pipe(
            O.fromNullable(cs.sprites[index]),
            O.map((sprite) => ({
              index: `${index}`,
              layer: `${sprite.layer}`,
              x: `${sprite.x}`,
              y: `${sprite.y}`,
            })),
          ),
        ),
      ),
    ),
    O.getOrElse(
      (): CharacterModeSelectedSpriteStageMetadata => ({
        index: "",
        layer: "",
        x: "",
        y: "",
      }),
    ),
  );

/**
 * 分解モードのカーソル種別を導出します。
 */
export const selectDecompositionCanvasCursor = (
  decompositionTool: DecompositionTool,
): string => {
  if (decompositionTool === "region") {
    return "copy";
  }
  if (decompositionTool === "eraser") {
    return "cell";
  }
  return "crosshair";
};

/**
 * 分解解析の結果を導出します。
 */
export const selectDecompositionAnalysis = (
  editorMode: CharacterEditorMode,
  decompositionCanvas: CharacterDecompositionCanvas,
  decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>,
  projectSpriteSize: 8 | 16,
  sprites: ReadonlyArray<SpriteTile>,
): CharacterDecompositionAnalysis =>
  editorMode !== "decompose"
    ? {
        spriteSize: projectSpriteSize,
        regions: [],
        reusableSpriteCount: 0,
        requiredNewSpriteCount: 0,
        availableEmptySlotCount: 0,
        canApply: false,
      }
    : analyzeCharacterDecomposition({
        canvas: decompositionCanvas,
        regions: [...decompositionRegions],
        spriteSize: projectSpriteSize,
        sprites: [...sprites],
      });

/**
 * 分解領域コンテキストメニューの表示可否を判定します。
 */
export const selectDecompositionRegionContextMenu = (
  editorMode: CharacterEditorMode,
  menuState: O.Option<DecompositionRegionContextMenuState>,
  analysis: CharacterDecompositionAnalysis,
): O.Option<DecompositionRegionContextMenuState> =>
  editorMode !== "decompose"
    ? O.none
    : pipe(
        menuState,
        O.chain((ms) =>
          pipe(
            O.fromNullable(
              analysis.regions.find((r) => r.region.id === ms.regionId),
            ),
            O.map(() => ms),
          ),
        ),
      );

/**
 * 有効な分解領域の数を導出します。
 */
export const selectDecompositionValidRegionCount = (
  analysis: CharacterDecompositionAnalysis,
): number =>
  analysis.regions.filter((region) => region.issues.length === 0).length;

/**
 * 無効な分解領域の数を導出します。
 */
export const selectDecompositionInvalidRegionCount = (
  analysis: CharacterDecompositionAnalysis,
): number =>
  analysis.regions.length -
  analysis.regions.filter((region) => region.issues.length === 0).length;

/**
 * 選択中リージョンの解析結果を導出します。
 */
export const selectSelectedRegionAnalysis = (
  selectedRegionId: O.Option<string>,
  analysis: CharacterDecompositionAnalysis,
): O.Option<CharacterDecompositionRegionAnalysis> =>
  pipe(
    selectedRegionId,
    O.chain((regionId) =>
      O.fromNullable(analysis.regions.find((r) => r.region.id === regionId)),
    ),
  );
