import React, { useState } from "react";
import { Global } from "@emotion/react";
import { PalettePicker } from "./components/PalettePicker";
import { ScreenMode } from "./components/ScreenMode";
import { SpriteMode } from "./components/SpriteMode";
import {
    AppHeader,
    Container,
    Eyebrow,
    globalStyles,
    LeftPane,
    ModeSwitcherCard,
    Panel,
    PanelHeader,
    PanelTitle,
    RightPane,
    SegmentedButton,
    SegmentedControl,
    WorkspaceGrid,
} from "./App.styles";

export const App: React.FC = () => {
    const [editMode, setEditMode] = useState<"screen" | "sprite">("sprite");

    return (
        <>
            <Global styles={globalStyles} />

            <Container>
                <AppHeader>
                    <ModeSwitcherCard>
                        <PanelHeader>
                            <Eyebrow>Editor Mode</Eyebrow>
                            <PanelTitle>作業モード</PanelTitle>
                        </PanelHeader>
                        <SegmentedControl>
                            <SegmentedButton active={editMode === "sprite"} onClick={() => setEditMode("sprite")}>
                                スプライト編集
                            </SegmentedButton>
                            <SegmentedButton active={editMode === "screen"} onClick={() => setEditMode("screen")}>
                                画面配置
                            </SegmentedButton>
                        </SegmentedControl>
                    </ModeSwitcherCard>
                </AppHeader>

                <WorkspaceGrid>
                    <LeftPane>{editMode === "sprite" ? <SpriteMode /> : <ScreenMode />}</LeftPane>

                    <RightPane>
                        <Panel>
                            <PanelHeader>
                                <Eyebrow>Palette Console</Eyebrow>
                                <PanelTitle>NES パレット</PanelTitle>
                            </PanelHeader>
                            <PalettePicker />
                        </Panel>
                    </RightPane>
                </WorkspaceGrid>
            </Container>
        </>
    );
};
