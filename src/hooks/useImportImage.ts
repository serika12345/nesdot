import { ProjectState } from "../store/projectState";

export default function useImportImage() {
    const importJSON = async (onImport: (data: ProjectState) => void) => {
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
