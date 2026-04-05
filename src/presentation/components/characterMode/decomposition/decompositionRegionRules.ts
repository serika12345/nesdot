import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { type ProjectSpriteSize } from "../../../../application/state/projectStore";
import {
  type CharacterDecompositionAnalysis,
  type CharacterDecompositionIssue,
  type CharacterDecompositionRegion,
} from "../../../../domain/characters/characterDecomposition";
import { clamp } from "../geometry/characterModeBounds";

/**
 * 1 つの分解領域をキャンバス内へ収まる座標に補正します。
 * ドラッグやリサイズ後に領域が外へ出ないよう、スプライトサイズを加味して丸める意図があります。
 */
export const clampDecompositionRegion = (
  region: CharacterDecompositionRegion,
  width: number,
  height: number,
  spriteSize: ProjectSpriteSize,
): CharacterDecompositionRegion => ({
  ...region,
  x: clamp(region.x, 0, Math.max(width - 8, 0)),
  y: clamp(region.y, 0, Math.max(height - spriteSize, 0)),
});

/**
 * 分解領域一覧をまとめてキャンバス内へ補正します。
 * ステージサイズ変更後も全領域を安全な座標へ寄せるためのバッチ処理です。
 */
export const clampDecompositionRegions = (
  regions: CharacterDecompositionRegion[],
  width: number,
  height: number,
  spriteSize: ProjectSpriteSize,
): CharacterDecompositionRegion[] =>
  regions.map((region) =>
    clampDecompositionRegion(region, width, height, spriteSize),
  );

/**
 * 分解解析で使う issue を UI 表示用ラベルへ変換します。
 * 内部識別子をそのまま出さず、一覧やバッジで読める日本語へ寄せる意図があります。
 */
export const getIssueLabel = (issue: CharacterDecompositionIssue): string => {
  if (issue === "mixed-palette") {
    return "複数パレット";
  }

  if (issue === "overlap") {
    return "重なり";
  }

  if (issue === "out-of-bounds") {
    return "範囲外";
  }

  return "空領域";
};

/**
 * 領域解析結果から現在の状態ラベルを組み立てます。
 * 問題の有無と再利用可否を優先順でまとめ、分解サイドバーが一目で状況を示せるようにします。
 */
export const getRegionStatusLabel = (
  region: CharacterDecompositionAnalysis["regions"][number],
): string => {
  if (region.issues.length > 0) {
    const issueOption = O.fromNullable(region.issues[0]);
    return pipe(
      issueOption,
      O.match(
        () => "空領域",
        (issue) => getIssueLabel(issue),
      ),
    );
  }

  if (region.resolution.kind === "existing") {
    return `再利用 #${region.resolution.spriteIndex}`;
  }

  if (region.resolution.kind === "planned") {
    return "新規追加";
  }

  return "未解決";
};
