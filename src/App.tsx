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
                        <AppSubtitle>主要操作を折りたたみ、キャンバスを見失わないデスクトップ向け構成にしています。</AppSubtitle>
                    </HeaderCopy>

                    <ModeSwitcherCard>
                        <PanelHeader>
                            <Eyebrow>Editor Mode</Eyebrow>
                            <PanelTitle>作業モード</PanelTitle>
                            <PanelDescription>スプライト編集と画面配置をここで切り替えます。</PanelDescription>
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
                                <PanelDescription>必要なときだけ展開して編集する右側の補助パネルです。</PanelDescription>
                            </PanelHeader>
                            <PalettePicker />
                        </Panel>
                    </RightPane>
                </WorkspaceGrid>
            </Container>
        </>
    );
};
