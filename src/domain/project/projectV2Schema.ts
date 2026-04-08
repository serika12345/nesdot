import { z } from "zod";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  PROJECT_FORMAT_VERSION,
  PROJECT_SPRITE_TILE_COUNT,
  SCREEN_BACKGROUND_PALETTE_INDEX_COUNT,
  SCREEN_BACKGROUND_TILE_INDEX_COUNT,
} from "./projectV2";

const ColorIndexOfPaletteSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

const PaletteIndexSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

const NesColorIndexSchema = z.number().int().min(0).max(63);
const PatternTableSelectSchema = z.union([z.literal(0), z.literal(1)]);
const PixelRowSchema = z.array(ColorIndexOfPaletteSchema).length(8);

const SpriteTileSchema = z
  .object({
    width: z.literal(8),
    height: z.union([z.literal(8), z.literal(16)]),
    paletteIndex: PaletteIndexSchema,
    pixels: z.array(PixelRowSchema),
  })
  .superRefine((value, ctx) => {
    if (value.pixels.length !== value.height) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SpriteTile pixels length must match height",
        path: ["pixels"],
      });
    }
  });

const SpriteInScreenSchema = SpriteTileSchema.extend({
  x: z.number().int(),
  y: z.number().int(),
  spriteIndex: z.number().int(),
  priority: z.enum(["front", "behindBg"]),
  flipH: z.boolean(),
  flipV: z.boolean(),
});

const BackgroundTileSchema = z.object({
  width: z.literal(8),
  height: z.literal(8),
  pixels: z.array(PixelRowSchema).length(8),
});

const Palette4ColorsSchema = z.tuple([
  NesColorIndexSchema,
  NesColorIndexSchema,
  NesColorIndexSchema,
  NesColorIndexSchema,
]);

export const ProjectStateV2Schema = z
  .object({
    formatVersion: z.literal(PROJECT_FORMAT_VERSION),
    spriteSize: z.union([z.literal(8), z.literal(16)]),
    spriteTiles: z.array(SpriteTileSchema).length(PROJECT_SPRITE_TILE_COUNT),
    backgroundTiles: z
      .array(BackgroundTileSchema)
      .length(PROJECT_BACKGROUND_TILE_COUNT),
    screen: z.object({
      width: z.literal(256),
      height: z.literal(240),
      background: z.object({
        widthTiles: z.literal(32),
        heightTiles: z.literal(30),
        tileIndices: z
          .array(z.number().int().min(0))
          .length(SCREEN_BACKGROUND_TILE_INDEX_COUNT),
        paletteIndices: z
          .array(PaletteIndexSchema)
          .length(SCREEN_BACKGROUND_PALETTE_INDEX_COUNT),
      }),
      sprites: z.array(SpriteInScreenSchema),
    }),
    palettes: z.object({
      universalBackgroundColor: NesColorIndexSchema,
      background: z.tuple([
        Palette4ColorsSchema,
        Palette4ColorsSchema,
        Palette4ColorsSchema,
        Palette4ColorsSchema,
      ]),
      sprite: z.tuple([
        Palette4ColorsSchema,
        Palette4ColorsSchema,
        Palette4ColorsSchema,
        Palette4ColorsSchema,
      ]),
    }),
    ppuControl: z.object({
      backgroundPatternTable: PatternTableSelectSchema,
      spritePatternTable: PatternTableSelectSchema,
    }),
  })
  .superRefine((value, ctx) => {
    if (
      value.spriteTiles.some((sprite) => sprite.height !== value.spriteSize)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ProjectStateV2 spriteTiles must match project spriteSize",
        path: ["spriteTiles"],
      });
    }

    if (
      value.screen.sprites.some((sprite) => sprite.height !== value.spriteSize)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ProjectStateV2 screen sprites must match project spriteSize",
        path: ["screen", "sprites"],
      });
    }
  });
