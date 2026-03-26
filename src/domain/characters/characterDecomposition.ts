import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { getArrayItem, getMatrixItem } from "../../shared/arrayAccess";
import {
  PaletteIndex,
  ProjectSpriteSize,
  SpriteTile,
  createEmptySpriteTile,
} from "../project/project";
import { CharacterSprite } from "./characterSet";

export type CharacterDecompositionPixel =
  | { kind: "transparent" }
  | { kind: "color"; paletteIndex: PaletteIndex; colorIndex: 1 | 2 | 3 };

export interface CharacterDecompositionCanvas {
  width: number;
  height: number;
  pixels: CharacterDecompositionPixel[][];
}

export interface CharacterDecompositionRegion {
  id: string;
  x: number;
  y: number;
}

export type CharacterDecompositionIssue =
  | "empty"
  | "mixed-palette"
  | "overlap"
  | "out-of-bounds";

type CharacterDecompositionResolution =
  | { kind: "invalid" }
  | { kind: "existing"; spriteIndex: number }
  | { kind: "planned"; plannedSpriteIndex: number };

export interface CharacterDecompositionRegionAnalysis {
  region: CharacterDecompositionRegion;
  issues: CharacterDecompositionIssue[];
  paletteIndex: O.Option<PaletteIndex>;
  matchedSpriteIndex: O.Option<number>;
  tile: O.Option<SpriteTile>;
  resolution: CharacterDecompositionResolution;
}

export interface CharacterDecompositionAnalysis {
  spriteSize: ProjectSpriteSize;
  regions: CharacterDecompositionRegionAnalysis[];
  reusableSpriteCount: number;
  requiredNewSpriteCount: number;
  availableEmptySlotCount: number;
  canApply: boolean;
}

interface CharacterDecompositionInput {
  canvas: CharacterDecompositionCanvas;
  regions: CharacterDecompositionRegion[];
  spriteSize: ProjectSpriteSize;
  sprites: SpriteTile[];
}

interface PlannedSpriteTile {
  plannedSpriteIndex: number;
  tile: SpriteTile;
}

interface CharacterDecompositionPlan {
  analysis: CharacterDecompositionAnalysis;
  plannedTiles: PlannedSpriteTile[];
}

export interface ApplyCharacterDecompositionResult {
  sprites: SpriteTile[];
  characterSprites: CharacterSprite[];
  analysis: CharacterDecompositionAnalysis;
}

const SPRITE_WIDTH = 8;

const isTransparentPixel = (
  pixel: CharacterDecompositionPixel,
): pixel is { kind: "transparent" } => pixel.kind === "transparent";

const rectanglesOverlap = (
  left: CharacterDecompositionRegion,
  right: CharacterDecompositionRegion,
  spriteSize: ProjectSpriteSize,
): boolean =>
  left.x < right.x + SPRITE_WIDTH &&
  left.x + SPRITE_WIDTH > right.x &&
  left.y < right.y + spriteSize &&
  left.y + spriteSize > right.y;

const isRegionOutOfBounds = (
  canvas: CharacterDecompositionCanvas,
  region: CharacterDecompositionRegion,
  spriteSize: ProjectSpriteSize,
): boolean => {
  const hasValidOrigin =
    Number.isInteger(region.x) &&
    Number.isInteger(region.y) &&
    region.x >= 0 &&
    region.y >= 0;

  if (hasValidOrigin === false) {
    return true;
  }

  return (
    region.x + SPRITE_WIDTH > canvas.width || region.y + spriteSize > canvas.height
  );
};

const hasRegionOverlap = (
  regions: ReadonlyArray<CharacterDecompositionRegion>,
  targetIndex: number,
  spriteSize: ProjectSpriteSize,
): boolean => {
  const targetRegionOption = getArrayItem(regions, targetIndex);
  if (O.isNone(targetRegionOption)) {
    return false;
  }

  return regions.some(
    (region, regionIndex) =>
      regionIndex !== targetIndex &&
      rectanglesOverlap(region, targetRegionOption.value, spriteSize),
  );
};

const extractRegionPixels = (
  canvas: CharacterDecompositionCanvas,
  region: CharacterDecompositionRegion,
  spriteSize: ProjectSpriteSize,
): CharacterDecompositionPixel[][] =>
  Array.from({ length: spriteSize }, (_, y) =>
    Array.from({ length: SPRITE_WIDTH }, (_, x) =>
      O.getOrElse<CharacterDecompositionPixel>(() => ({
        kind: "transparent",
      }))(getMatrixItem(canvas.pixels, region.y + y, region.x + x)),
    ),
  );

const collectPaletteIndices = (
  pixels: ReadonlyArray<ReadonlyArray<CharacterDecompositionPixel>>,
): PaletteIndex[] =>
  pixels.flatMap((row) =>
    row.flatMap((pixel) =>
      isTransparentPixel(pixel) ? [] : [pixel.paletteIndex],
    ),
  ).reduce<PaletteIndex[]>(
    (acc, paletteIndex) =>
      acc.includes(paletteIndex) ? acc : [...acc, paletteIndex],
    [],
  );

const toSpriteTile = (
  pixels: ReadonlyArray<ReadonlyArray<CharacterDecompositionPixel>>,
  spriteSize: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile => ({
  ...createEmptySpriteTile(spriteSize, paletteIndex),
  pixels: pixels.map((row) =>
    row.map((pixel) => (isTransparentPixel(pixel) ? 0 : pixel.colorIndex)),
  ),
});

const tilesAreEqual = (left: SpriteTile, right: SpriteTile): boolean =>
  left.width === right.width &&
  left.height === right.height &&
  left.paletteIndex === right.paletteIndex &&
  left.pixels.every((row, rowIndex) =>
    row.every(
      (colorIndex, columnIndex) =>
        O.getOrElse(() => -1)(
          getMatrixItem(right.pixels, rowIndex, columnIndex),
        ) === colorIndex,
    ),
  );

const findMatchingSpriteIndex = (
  sprites: ReadonlyArray<SpriteTile>,
  tile: SpriteTile,
): O.Option<number> => {
  const matchIndex = sprites.findIndex((sprite) => tilesAreEqual(sprite, tile));
  return matchIndex < 0 ? O.none : O.some(matchIndex);
};

const isEmptySpriteSlot = (
  sprite: SpriteTile,
  spriteSize: ProjectSpriteSize,
): boolean =>
  sprite.height === spriteSize &&
  sprite.pixels.every((row) => row.every((colorIndex) => colorIndex === 0));

const getEmptySlotIndices = (
  sprites: ReadonlyArray<SpriteTile>,
  spriteSize: ProjectSpriteSize,
): number[] =>
  sprites.flatMap((sprite, spriteIndex) =>
    isEmptySpriteSlot(sprite, spriteSize) ? [spriteIndex] : [],
  );

const analyzeBaseRegion = (
  input: CharacterDecompositionInput,
  region: CharacterDecompositionRegion,
  regionIndex: number,
): CharacterDecompositionRegionAnalysis => {
  const outOfBoundsIssues: CharacterDecompositionIssue[] = isRegionOutOfBounds(
    input.canvas,
    region,
    input.spriteSize,
  )
    ? ["out-of-bounds"]
    : [];
  const overlapIssues: CharacterDecompositionIssue[] = hasRegionOverlap(
    input.regions,
    regionIndex,
    input.spriteSize,
  )
    ? ["overlap"]
    : [];
  const issues: CharacterDecompositionIssue[] = [
    ...outOfBoundsIssues,
    ...overlapIssues,
  ];

  if (issues.length > 0) {
    return {
      region,
      issues,
      paletteIndex: O.none,
      matchedSpriteIndex: O.none,
      tile: O.none,
      resolution: { kind: "invalid" },
    };
  }

  const pixels = extractRegionPixels(input.canvas, region, input.spriteSize);
  const paletteIndices = collectPaletteIndices(pixels);
  if (paletteIndices.length === 0) {
    return {
      region,
      issues: ["empty"],
      paletteIndex: O.none,
      matchedSpriteIndex: O.none,
      tile: O.none,
      resolution: { kind: "invalid" },
    };
  }

  if (paletteIndices.length > 1) {
    return {
      region,
      issues: ["mixed-palette"],
      paletteIndex: O.none,
      matchedSpriteIndex: O.none,
      tile: O.none,
      resolution: { kind: "invalid" },
    };
  }

  const paletteIndexOption = getArrayItem(paletteIndices, 0);
  if (O.isNone(paletteIndexOption)) {
    return {
      region,
      issues: ["empty"],
      paletteIndex: O.none,
      matchedSpriteIndex: O.none,
      tile: O.none,
      resolution: { kind: "invalid" },
    };
  }

  const tile = toSpriteTile(pixels, input.spriteSize, paletteIndexOption.value);
  const matchedSpriteIndex = findMatchingSpriteIndex(input.sprites, tile);

  return {
    region,
    issues: [],
    paletteIndex: O.some(paletteIndexOption.value),
    matchedSpriteIndex,
    tile: O.some(tile),
    resolution:
      O.isSome(matchedSpriteIndex)
        ? {
            kind: "existing",
            spriteIndex: matchedSpriteIndex.value,
          }
        : { kind: "invalid" },
  };
};

const assignRegionResolutions = (
  regions: ReadonlyArray<CharacterDecompositionRegionAnalysis>,
): {
  regions: CharacterDecompositionRegionAnalysis[];
  plannedTiles: PlannedSpriteTile[];
} =>
  regions.reduce<{
    regions: CharacterDecompositionRegionAnalysis[];
    plannedTiles: PlannedSpriteTile[];
  }>(
    (acc, region) => {
      if (region.issues.length > 0 || O.isNone(region.tile)) {
        return {
          ...acc,
          regions: [...acc.regions, region],
        };
      }

      if (O.isSome(region.matchedSpriteIndex)) {
        return {
          ...acc,
          regions: [
            ...acc.regions,
            {
              ...region,
              resolution: {
                kind: "existing",
                spriteIndex: region.matchedSpriteIndex.value,
              },
            },
          ],
        };
      }

      const tile = region.tile.value;
      const matchingPlannedTileOption = O.fromNullable(
        acc.plannedTiles.find((plannedTile) =>
          tilesAreEqual(plannedTile.tile, tile),
        ),
      );

      if (O.isSome(matchingPlannedTileOption)) {
        return {
          ...acc,
          regions: [
            ...acc.regions,
            {
              ...region,
              resolution: {
                kind: "planned",
                plannedSpriteIndex:
                  matchingPlannedTileOption.value.plannedSpriteIndex,
              },
            },
          ],
        };
      }

      const nextPlannedTile: PlannedSpriteTile = {
        plannedSpriteIndex: acc.plannedTiles.length,
        tile,
      };

      return {
        plannedTiles: [...acc.plannedTiles, nextPlannedTile],
        regions: [
          ...acc.regions,
          {
            ...region,
            resolution: {
              kind: "planned",
              plannedSpriteIndex: nextPlannedTile.plannedSpriteIndex,
            },
          },
        ],
      };
    },
    {
      regions: [],
      plannedTiles: [],
    },
  );

const buildCharacterDecompositionPlan = (
  input: CharacterDecompositionInput,
): CharacterDecompositionPlan => {
  const baseRegions = input.regions.map((region, regionIndex) =>
    analyzeBaseRegion(input, region, regionIndex),
  );
  const assignedRegions = assignRegionResolutions(baseRegions);
  const reusableSpriteCount = assignedRegions.regions.filter(
    (region) => region.resolution.kind === "existing",
  ).length;
  const requiredNewSpriteCount = assignedRegions.plannedTiles.length;
  const availableEmptySlotCount = getEmptySlotIndices(
    input.sprites,
    input.spriteSize,
  ).length;
  const canApply =
    assignedRegions.regions.every((region) => region.issues.length === 0) &&
    requiredNewSpriteCount <= availableEmptySlotCount;

  return {
    analysis: {
      spriteSize: input.spriteSize,
      regions: assignedRegions.regions,
      reusableSpriteCount,
      requiredNewSpriteCount,
      availableEmptySlotCount,
      canApply,
    },
    plannedTiles: assignedRegions.plannedTiles,
  };
};

const buildFailureMessage = (
  analysis: CharacterDecompositionAnalysis,
): string => {
  const hasInvalidRegion = analysis.regions.some((region) => region.issues.length > 0);
  if (hasInvalidRegion === true) {
    return "cannot apply character decomposition with invalid regions";
  }

  return "not enough empty sprite slots for character decomposition";
};

interface AssignedSpriteSlot {
  plannedSpriteIndex: number;
  spriteIndex: number;
  tile: SpriteTile;
}

const assignSpriteSlots = (
  emptySlotIndices: ReadonlyArray<number>,
  plannedTiles: ReadonlyArray<PlannedSpriteTile>,
): E.Either<string, AssignedSpriteSlot[]> =>
  plannedTiles.reduce<E.Either<string, AssignedSpriteSlot[]>>(
    (acc, plannedTile, plannedIndex) => {
      if (E.isLeft(acc)) {
        return acc;
      }

      const spriteIndexOption = getArrayItem(emptySlotIndices, plannedIndex);
      if (O.isNone(spriteIndexOption)) {
        return E.left("failed to assign an empty sprite slot");
      }

      return E.right([
        ...acc.right,
        {
          plannedSpriteIndex: plannedTile.plannedSpriteIndex,
          spriteIndex: spriteIndexOption.value,
          tile: plannedTile.tile,
        },
      ]);
    },
    E.right([]),
  );

const resolveAssignedSpriteIndex = (
  region: CharacterDecompositionRegionAnalysis,
  assignedSlots: ReadonlyArray<AssignedSpriteSlot>,
): O.Option<number> => {
  if (region.resolution.kind === "existing") {
    return O.some(region.resolution.spriteIndex);
  }

  if (region.resolution.kind === "planned") {
    const plannedSpriteIndex = region.resolution.plannedSpriteIndex;
    const assignedSlotOption = O.fromNullable(
      assignedSlots.find(
        (slot) => slot.plannedSpriteIndex === plannedSpriteIndex,
      ),
    );

    return O.map((assignedSlot: AssignedSpriteSlot) => assignedSlot.spriteIndex)(
      assignedSlotOption,
    );
  }

  return O.none;
};

const buildCharacterSprites = (
  regions: ReadonlyArray<CharacterDecompositionRegionAnalysis>,
  assignedSlots: ReadonlyArray<AssignedSpriteSlot>,
): E.Either<string, CharacterSprite[]> =>
  regions.reduce<E.Either<string, CharacterSprite[]>>(
    (acc, region, layer) => {
      if (E.isLeft(acc)) {
        return acc;
      }

      const spriteIndexOption = resolveAssignedSpriteIndex(region, assignedSlots);
      if (O.isNone(spriteIndexOption)) {
        return E.left("failed to resolve a sprite index for a decomposition region");
      }

      return E.right([
        ...acc.right,
        {
          spriteIndex: spriteIndexOption.value,
          x: region.region.x,
          y: region.region.y,
          layer,
        },
      ]);
    },
    E.right([]),
  );

const applyAssignedTiles = (
  sprites: ReadonlyArray<SpriteTile>,
  assignedSlots: ReadonlyArray<AssignedSpriteSlot>,
): SpriteTile[] =>
  sprites.map((sprite, spriteIndex) => {
    const assignedSlot = assignedSlots.find((slot) => slot.spriteIndex === spriteIndex);
    return assignedSlot?.tile ?? sprite;
  });

export const analyzeCharacterDecomposition = (
  input: CharacterDecompositionInput,
): CharacterDecompositionAnalysis => buildCharacterDecompositionPlan(input).analysis;

export const applyCharacterDecomposition = (
  input: CharacterDecompositionInput,
): E.Either<string, ApplyCharacterDecompositionResult> => {
  const plan = buildCharacterDecompositionPlan(input);
  if (plan.analysis.canApply === false) {
    return E.left(buildFailureMessage(plan.analysis));
  }

  const assignedSlots = assignSpriteSlots(
    getEmptySlotIndices(input.sprites, input.spriteSize),
    plan.plannedTiles,
  );
  if (E.isLeft(assignedSlots)) {
    return assignedSlots;
  }

  const characterSprites = buildCharacterSprites(
    plan.analysis.regions,
    assignedSlots.right,
  );
  if (E.isLeft(characterSprites)) {
    return characterSprites;
  }

  return E.right({
    sprites: applyAssignedTiles(input.sprites, assignedSlots.right),
    characterSprites: characterSprites.right,
    analysis: plan.analysis,
  });
};
