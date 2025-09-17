// App.tsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Container, H3, LeftPane, RightPane } from "./App.styles";
import { PalettePicker } from "./components/PalettePicker";

// ★ 追加: 任意サイズ対応ユーティリティ
import { ScreenMode } from "./components/ScreenMode";
import { SpriteMode } from "./components/SpriteMode";

// 分割後のモード別コンポーネント
export const App: React.FC = () => {
    const [editMode, setEditMode] = useState<"screen" | "sprite">("sprite");
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
                {editMode === "sprite" && <SpriteMode />}
                {editMode === "screen" && <ScreenMode />}
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
