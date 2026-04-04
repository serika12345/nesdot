import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { type ProjectSpriteSize } from "../../../../application/state/projectStore";
import {
  type CharacterDecompositionAnalysis,
  type CharacterDecompositionIssue,
  type CharacterDecompositionRegion,
} from "../../../../domain/characters/characterDecomposition";
import { clamp } from "../geometry/characterModeBounds";

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

export const clampDecompositionRegions = (
  regions: CharacterDecompositionRegion[],
  width: number,
  height: number,
  spriteSize: ProjectSpriteSize,
): CharacterDecompositionRegion[] =>
  regions.map((region) =>
    clampDecompositionRegion(region, width, height, spriteSize),
  );

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
