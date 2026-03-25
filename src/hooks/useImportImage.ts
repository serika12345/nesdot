import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import * as O from "fp-ts/Option";
import { ProjectState } from "../store/projectState";

type NativeImportResult =
  | { status: "selected"; text: string }
  | { status: "cancelled" }
  | { status: "unavailable" };

export default function useImportImage() {
  const readJsonWithNativeDialog = async (): Promise<NativeImportResult> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "JSON file", extensions: ["json"] }],
      });

      if (!selected) {
        return { status: "cancelled" };
      }

      if (Array.isArray(selected)) {
        if (!selected[0]) {
          return { status: "cancelled" };
        }

        return { status: "selected", text: await readTextFile(selected[0]) };
      }

      return { status: "selected", text: await readTextFile(selected) };
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
        input.onchange = undefined;
        input.oncancel = undefined;
        document.body.removeChild(input);
      };

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          cleanup();
          resolve(O.none);
          return;
        }

        try {
          resolve(await file.text());
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
      onImport(JSON.parse(nativeResult.text) as ProjectState);
      return true;
    }

    if (nativeResult.status === "cancelled") {
      return false;
    }

    const fallbackText = await readJsonWithInputFallback();
    if (O.isNone(fallbackText)) {
      return false;
    }

    onImport(JSON.parse(fallbackText.value) as ProjectState);
    return true;
  };

  return { importJSON };
}
