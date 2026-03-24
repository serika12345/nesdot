import React, { useState } from "react";
import { Global } from "@emotion/react";
import { PalettePicker } from "./components/PalettePicker";
import { ScreenMode } from "./components/ScreenMode";
import { SpriteMode } from "./components/SpriteMode";
import {
    AppHeader,
    AppSubtitle,
    AppTitle,
    Container,
    Eyebrow,
    globalStyles,
    HeaderCopy,
    LeftPane,
    ModeSwitcherCard,
    Panel,
    PanelDescription,
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
                    <HeaderCopy>
                        <Eyebrow>NES Visual Editor</Eyebrow>
                        <AppTitle>nesdot workspace</AppTitle>
                        <AppSubtitle>
                            スプライト編集、スクリーン配置、パレット調整をひとつの作業面にまとめたデスクトップ向けUIです。
                        </AppSubtitle>
                    </HeaderCopy>

                    <ModeSwitcherCard>
                        <PanelHeader>
                            <Eyebrow>Editor Mode</Eyebrow>
                            <PanelTitle>作業モード</PanelTitle>
                            <PanelDescription>
                                現在の機能はそのままに、モード切り替えだけを常時見えるセグメントに整理しています。
                            </PanelDescription>
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
                                <PanelDescription>
                                    4つのパレットと NES 64色を右ペインに固定し、どのモードでも同じ場所から編集できます。
                                </PanelDescription>
                            </PanelHeader>
                            <PalettePicker />
                        </Panel>
                    </RightPane>
                </WorkspaceGrid>
            </Container>
        </>
    );
};
