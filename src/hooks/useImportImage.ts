import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { ProjectState } from "../store/projectState";

export default function useImportImage() {
    const readJsonWithNativeDialog = async (): Promise<string | null | undefined> => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: "JSON file", extensions: ["json"] }],
            });

            if (!selected) {
                return null;
            }

            if (Array.isArray(selected)) {
                return selected[0] ? await readTextFile(selected[0]) : null;
            }

            return await readTextFile(selected);
        } catch {
            return undefined;
        }
    };

    const importJSON = async (onImport: (data: ProjectState) => void) => {
        const nativeText = await readJsonWithNativeDialog();
        if (typeof nativeText === "string") {
            onImport(JSON.parse(nativeText) as ProjectState);
            return;
        }

        if (nativeText === null) {
            throw new Error("No file selected");
        }

        // JSONインポート：ファイル選択ダイアログを出して読み込み
        return new Promise<void>((resolve, reject) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json,application/json";
            input.style.display = "none";
            document.body.appendChild(input);
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) {
                    document.body.removeChild(input);
                    reject(new Error("No file selected"));
                    return;
                }
                try {
                    const text = await file.text();
                    const data = JSON.parse(text) as ProjectState;
                    onImport(data);
                    resolve();
                } catch (err) {
                    reject(err);
                } finally {
                    document.body.removeChild(input);
                }
            };
            input.click();
        });
    };
    return { importJSON };
}
