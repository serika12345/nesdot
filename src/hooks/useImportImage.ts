import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import * as O from "fp-ts/Option";
import { z } from "zod";
import {
  createDefaultNesProjectState,
  NesBackgroundPalettes,
  NesProjectState,
  NesSpritePalettes,
} from "../store/nesProjectState";
import type { ProjectState } from "../store/projectState";

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

const Palette4ColorsSchema = z.tuple([
  NesColorIndexSchema,
  NesColorIndexSchema,
  NesColorIndexSchema,
  NesColorIndexSchema,
]);

const PalettesSchema = z.tuple([
  Palette4ColorsSchema,
  Palette4ColorsSchema,
  Palette4ColorsSchema,
  Palette4ColorsSchema,
]);

const PixelRowSchema = z.array(ColorIndexOfPaletteSchema).length(8);
const SpritePixelsSchema = z.array(PixelRowSchema);

const SpriteTileSchema = z
  .object({
    width: z.literal(8),
    height: z.union([z.literal(8), z.literal(16)]),
    paletteIndex: PaletteIndexSchema,
    pixels: SpritePixelsSchema,
  })
  .superRefine((value, ctx) => {
    if (value.pixels.length !== value.height) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SpriteTile pixels length must match height",
      });
    }
  });

const SpriteInScreenSchema = SpriteTileSchema.extend({
  x: z.number().int(),
  y: z.number().int(),
  spriteIndex: z.number().int(),
});

const ScreenSchema = z.object({
  width: z.literal(256),
  height: z.literal(240),
  sprites: z.array(SpriteInScreenSchema),
});

const PatternTableSelectSchema = z.union([z.literal(0), z.literal(1)]);

const NesNameTableSchema = z.object({
  widthTiles: z.literal(32),
  heightTiles: z.literal(30),
  tileIndices: z.array(z.number().int().min(0)).length(960),
});

const NesAttributeTableSchema = z.object({
  widthBytes: z.literal(8),
  heightBytes: z.literal(8),
  bytes: z.array(z.number().int().min(0).max(255)).length(64),
});

const OamSpriteEntrySchema = z.object({
  y: z.number().int(),
  tileIndex: z.number().int().min(0).max(255),
  attributeByte: z.number().int().min(0).max(255),
  x: z.number().int(),
});

const PpuControlStateSchema = z.object({
  spriteSize: z.union([z.literal(8), z.literal(16)]),
  backgroundPatternTable: PatternTableSelectSchema,
  spritePatternTable: PatternTableSelectSchema,
});

const NesProjectStateSchema = z.object({
  chrBytes: z.array(z.number().int().min(0).max(255)).length(4096),
  nameTable: NesNameTableSchema,
  attributeTable: NesAttributeTableSchema,
  universalBackgroundColor: z.number().int().min(0).max(63),
  backgroundPalettes: z.tuple([
    Palette4ColorsSchema,
    Palette4ColorsSchema,
    Palette4ColorsSchema,
    Palette4ColorsSchema,
  ]),
  spritePalettes: z.tuple([
    Palette4ColorsSchema,
    Palette4ColorsSchema,
    Palette4ColorsSchema,
    Palette4ColorsSchema,
  ]),
  oam: z.array(OamSpriteEntrySchema).length(64),
  ppuControl: PpuControlStateSchema,
});

const ProjectStateSchema = z.object({
  screen: ScreenSchema,
  palettes: PalettesSchema.optional(),
  sprites: z.array(SpriteTileSchema).length(64),
  nes: NesProjectStateSchema.optional(),
  _hydrated: z.boolean().optional(),
});

const OpenDialogSelectedSchema = z.union([z.string(), z.array(z.string())]);

const toNesBackgroundPalettes = (
  palettes: z.infer<typeof PalettesSchema>,
): NesBackgroundPalettes => [
  [palettes[0][0], palettes[0][1], palettes[0][2], palettes[0][3]],
  [palettes[1][0], palettes[1][1], palettes[1][2], palettes[1][3]],
  [palettes[2][0], palettes[2][1], palettes[2][2], palettes[2][3]],
  [palettes[3][0], palettes[3][1], palettes[3][2], palettes[3][3]],
];

const toNesSpritePalettes = (
  palettes: z.infer<typeof PalettesSchema>,
): NesSpritePalettes => [
  [palettes[0][0], palettes[0][1], palettes[0][2], palettes[0][3]],
  [palettes[1][0], palettes[1][1], palettes[1][2], palettes[1][3]],
  [palettes[2][0], palettes[2][1], palettes[2][2], palettes[2][3]],
  [palettes[3][0], palettes[3][1], palettes[3][2], palettes[3][3]],
];

const normalizeNesState = (
  inputNes: z.infer<typeof NesProjectStateSchema> | undefined,
  legacyPalettes: z.infer<typeof PalettesSchema> | undefined,
): NesProjectState => {
  if (inputNes !== undefined) {
    return inputNes;
  }

  if (legacyPalettes !== undefined) {
    const base = createDefaultNesProjectState();
    return {
      ...base,
      backgroundPalettes: toNesBackgroundPalettes(legacyPalettes),
      spritePalettes: toNesSpritePalettes(legacyPalettes),
    };
  }

  return createDefaultNesProjectState();
};

const normalizeProjectState = (
  state: z.infer<typeof ProjectStateSchema>,
): ProjectState => {
  const baseState: Omit<ProjectState, "_hydrated"> = {
    screen: state.screen,
    sprites: state.sprites,
    nes: normalizeNesState(state.nes, state.palettes),
  };

  return state._hydrated === undefined
    ? baseState
    : { ...baseState, _hydrated: state._hydrated };
};

const parseProjectState = (text: string): O.Option<ProjectState> => {
  try {
    const parsed: unknown = JSON.parse(text);
    const schemaResult = ProjectStateSchema.safeParse(parsed);
    if (schemaResult.success === true) {
      return O.some(normalizeProjectState(schemaResult.data));
    }
    return O.none;
  } catch {
    return O.none;
  }
};

type NativeImportResult =
  | { status: "selected"; text: string }
  | { status: "cancelled" }
  | { status: "unavailable" };

export default function useImportImage() {
  const noopInputHandler = () => {};

  const readJsonWithNativeDialog = async (): Promise<NativeImportResult> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "JSON file", extensions: ["json"] }],
      });
      const selectedOption = O.fromNullable(selected);

      if (O.isNone(selectedOption)) {
        return { status: "cancelled" };
      }
      const selectedParsed = OpenDialogSelectedSchema.safeParse(
        selectedOption.value,
      );
      if (selectedParsed.success === false) {
        return { status: "unavailable" };
      }
      const selectedValue = selectedParsed.data;

      if (selectedValue === "") {
        return { status: "cancelled" };
      }

      if (Array.isArray(selectedValue)) {
        if (selectedValue.length === 0) {
          return { status: "cancelled" };
        }

        const selectedPathOption = O.fromNullable(selectedValue[0]);
        if (O.isNone(selectedPathOption) || selectedPathOption.value === "") {
          return { status: "cancelled" };
        }

        return {
          status: "selected",
          text: await readTextFile(selectedPathOption.value),
        };
      }

      return { status: "selected", text: await readTextFile(selectedValue) };
    } catch {
      return { status: "unavailable" };
    }
  };

  const readJsonWithInputFallback = async (): Promise<O.Option<string>> => {
    return new Promise<O.Option<string>>((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.style.display = "none";
      document.body.appendChild(input);

      const cleanup = () => {
        input.onchange = noopInputHandler;
        input.oncancel = noopInputHandler;
        document.body.removeChild(input);
      };

      input.onchange = async (e) => {
        void e;
        const fileOption = O.fromNullable(input.files?.[0]);
        if (O.isNone(fileOption)) {
          cleanup();
          resolve(O.none);
          return;
        }
        const file = fileOption.value;

        try {
          resolve(O.some(await file.text()));
        } catch (err) {
          reject(err);
        } finally {
          cleanup();
        }
      };

      input.oncancel = () => {
        cleanup();
        resolve(O.none);
      };

      input.click();
    });
  };

  const importJSON = async (
    onImport: (data: ProjectState) => void,
  ): Promise<boolean> => {
    const nativeResult = await readJsonWithNativeDialog();

    if (nativeResult.status === "selected") {
      const parsedOption = parseProjectState(nativeResult.text);
      if (O.isNone(parsedOption)) {
        alert("JSON の形式が不正です。インポートを中止しました。");
        return false;
      }
      onImport(parsedOption.value);
      return true;
    }

    if (nativeResult.status === "cancelled") {
      return false;
    }

    const fallbackText = await readJsonWithInputFallback();
    if (O.isNone(fallbackText)) {
      return false;
    }

    const parsedOption = parseProjectState(fallbackText.value);
    if (O.isNone(parsedOption)) {
      alert("JSON の形式が不正です。インポートを中止しました。");
      return false;
    }
    onImport(parsedOption.value);
    return true;
  };

  return { importJSON };
}
