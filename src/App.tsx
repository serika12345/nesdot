// App.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { CanvasActions, Container, H3, LeftPane, RightPane } from "./App.styles";
import { PalettePicker } from "./components/PalettePicker";
import { ColorIndexOfPalette, PaletteIndex, SpriteTile, useProjectState } from "./store/projectState";

// ★ 追加: 任意サイズ対応ユーティリティ
import { Tool } from "./components/hooks/useSpriteCanvas";
import { ScreenMode } from "./components/ScreenMode";
import { SpriteMode } from "./components/SpriteMode";
import useExportImage from "./hooks/useExportImage";
import useImportImage from "./hooks/useImportImage";

// 分割後のモード別コンポーネント

declare global {
    interface Window {
        api?: {
            saveBytes: (data: Uint8Array, defaultFileName: string) => Promise<void>;
        };
    }
}

export const App: React.FC = () => {
    // ★ App 内の ProjectState は zustand から取得
    // もともとの spriteSize は廃止し、tile.width/height を真実のソースにします
    const projectState = useProjectState((s) => s);
    const palettes = useProjectState((s) => s.palettes);
    const sprites = useProjectState((s) => s.sprites);

    // UI 用の一時状態はローカルで維持
    const [tool, setTool] = useState<Tool>("pen");
    const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
    const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1); // 0は透明スロット扱い
    const [activeSprite, setActiveSprite] = useState<number>(0);
    const [editMode, setEditMode] = useState<"screen" | "sprite">("sprite");

    const activeTile = useProjectState((s) => s.sprites[activeSprite]);

    const { exportChr, exportPng, exportSvgSimple, exportJSON } = useExportImage();
    const { importJSON } = useImportImage();

    // ★ zustand の setState で部分更新
    const setTile = (t: SpriteTile, index: number) => {
        const newSprites = [...sprites];
        newSprites[index] = t;
        useProjectState.setState({ sprites: newSprites });
    };

    // ★ インポートハンドラ
    const handleImport = async () => {
        try {
            await importJSON((data) => {
                useProjectState.setState(data);
            });
        } catch (err) {
            alert("インポートに失敗しました: " + err);
        }
    };

    return (
        <Container>
            <LeftPane>
                <div>
                    <label>編集モード</label>
                    <select value={editMode} onChange={(e) => setEditMode(e.target.value as "screen" | "sprite")}>
                        <option value="screen">画面</option>
                        <option value="sprite">スプライト</option>
                    </select>
                </div>

                {editMode === "sprite" && (
                    <SpriteMode
                        // state
                        tool={tool}
                        activePalette={activePalette}
                        activeSlot={activeSlot}
                        activeSprite={activeSprite}
                        activeTile={activeTile}
                        palettes={palettes}
                        sprites={sprites}
                        // setters
                        setTool={setTool}
                        setActivePalette={setActivePalette}
                        setActiveSlot={setActiveSlot}
                        setActiveSprite={setActiveSprite}
                        setTile={setTile}
                    />
                )}

                {editMode === "screen" && <ScreenMode />}

                <CanvasActions>
                    <button onClick={() => exportChr(activeTile, activePalette)}>CHRエクスポート</button>
                    <button onClick={() => exportPng(activeTile)}>PNGエクスポート</button>
                    <button onClick={() => exportSvgSimple(activeTile)}>SVGエクスポート</button>
                    <button onClick={() => exportJSON(projectState)}>保存</button>
                    <button onClick={handleImport}>復元</button>
                </CanvasActions>
            </LeftPane>

            <RightPane>
                <H3>パレット</H3>
                <PalettePicker />
            </RightPane>
        </Container>
    );
};

const root = createRoot(document.body);
root.render(<App />);
