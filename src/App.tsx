import React, { useState } from "react";
import { Global } from "@emotion/react";
import { PalettePicker } from "./components/PalettePicker";
import { ScreenMode } from "./components/ScreenMode";
import { SpriteMode } from "./components/SpriteMode";
import {
    Container,
    globalStyles,
    LeftPane,
    ModeSwitcherCard,
    ModeSwitcherHeader,
    ModeSwitcherLayout,
    ModeSwitcherTitle,
    Panel,
    PanelHeader,
    PanelTitle,
    RightPane,
    ScrollArea,
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
                <WorkspaceGrid>
                    <LeftPane>{editMode === "sprite" ? <SpriteMode /> : <ScreenMode />}</LeftPane>

                    <RightPane>
                        <ModeSwitcherCard>
                            <ModeSwitcherLayout>
                                <ModeSwitcherHeader>
                                    <ModeSwitcherTitle>作業モード</ModeSwitcherTitle>
                                </ModeSwitcherHeader>
                                <SegmentedControl>
                                    <SegmentedButton active={editMode === "sprite"} onClick={() => setEditMode("sprite")}>
                                        スプライト編集
                                    </SegmentedButton>
                                    <SegmentedButton active={editMode === "screen"} onClick={() => setEditMode("screen")}>
                                        画面配置
                                    </SegmentedButton>
                                </SegmentedControl>
                            </ModeSwitcherLayout>
                        </ModeSwitcherCard>

                        <Panel css={{ gridTemplateRows: "auto minmax(0, 1fr)" }}>
                            <PanelHeader>
                                <PanelTitle>NES パレット</PanelTitle>
                            </PanelHeader>
                            <ScrollArea>
                                <PalettePicker />
                            </ScrollArea>
                        </Panel>
                    </RightPane>
                </WorkspaceGrid>
            </Container>
        </>
    );
};
