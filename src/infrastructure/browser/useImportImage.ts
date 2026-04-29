import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { z } from "zod";
import {
  CharacterJsonData,
  useCharacterState,
} from "../../application/state/characterStore";
import type { ProjectState } from "../../domain/project/project";
import { ProjectStateSchema } from "../../domain/project/projectSchema";

const CharacterSpriteSchema = z.object({
  spriteIndex: z.number().int().min(0).max(63),
  x: z.number().int().min(0).max(255),
  y: z.number().int().min(0).max(239),
  layer: z.number().int().min(0).max(63),
});

const CharacterSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  sprites: z.array(CharacterSpriteSchema),
});

const CharacterJsonDataSchema = z.object({
  characterSets: z.array(CharacterSetSchema),
  selectedCharacterId: z.string().optional(),
});

const ProjectImportSchema = ProjectStateSchema.extend({
  characters: CharacterJsonDataSchema.optional(),
});

const OpenDialogSelectedSchema = z.union([z.string(), z.array(z.string())]);

const normalizeProjectState = (
  state: z.infer<typeof ProjectImportSchema>,
): ProjectState => ({
  formatVersion: state.formatVersion,
  spriteSize: state.spriteSize,
  spriteTiles: state.spriteTiles,
  backgroundTiles: state.backgroundTiles,
  screen: state.screen,
  palettes: state.palettes,
  ppuControl: state.ppuControl,
});

const normalizeCharacterJsonData = (
  characters: z.infer<typeof CharacterJsonDataSchema>,
): CharacterJsonData => ({
  characterSets: characters.characterSets,
  ...pipe(
    O.fromNullable(characters.selectedCharacterId),
    O.match(
      () => ({}),
      (selectedCharacterId) => ({ selectedCharacterId }),
    ),
  ),
});

interface ParsedProjectImport {
  projectState: ProjectState;
  characterData: CharacterJsonData;
}

const parseProjectState = (text: string): O.Option<ParsedProjectImport> => {
  try {
    const parsed: unknown = JSON.parse(text);
    const schemaResult = ProjectImportSchema.safeParse(parsed);
    if (schemaResult.success === true) {
      const normalizedProject = normalizeProjectState(schemaResult.data);
      const normalizedCharacterData: CharacterJsonData = pipe(
        O.fromNullable(schemaResult.data.characters),
        O.match(
          (): CharacterJsonData => ({ characterSets: [] }),
          (characters): CharacterJsonData =>
            normalizeCharacterJsonData(characters),
        ),
      );
      return O.some({
        projectState: normalizedProject,
        characterData: normalizedCharacterData,
      });
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

/**
 * JSON インポート処理と入力値検証をまとめて提供するフックです。
 * 外部データを zod で正規化してから状態へ流し込み、壊れた保存データの流入を境界で止めます。
 */
export default function useImportImage() {
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
      input.setAttribute("type", "file");
      input.setAttribute("accept", ".json,application/json");
      input.hidden = true;
      document.body.appendChild(input);

      const onChange = async () => {
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

      const onCancel = () => {
        cleanup();
        resolve(O.none);
      };

      const cleanup = () => {
        input.removeEventListener("change", onChange);
        input.removeEventListener("cancel", onCancel);
        document.body.removeChild(input);
      };

      input.addEventListener("change", onChange);
      input.addEventListener("cancel", onCancel);

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
      onImport(parsedOption.value.projectState);
      useCharacterState
        .getState()
        .setFromJson(parsedOption.value.characterData);
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
    onImport(parsedOption.value.projectState);
    useCharacterState.getState().setFromJson(parsedOption.value.characterData);
    return true;
  };

  return { importJSON };
}
