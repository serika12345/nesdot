import { Global } from "@emotion/react";
import React, { useState } from "react";
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
import { CharacterMode } from "./components/CharacterMode";
import { PalettePicker } from "./components/PalettePicker";
import { ScreenMode } from "./components/ScreenMode";
import { SpriteMode } from "./components/SpriteMode";

export const App: React.FC = () => {
  const [editMode, setEditMode] = useState<"screen" | "sprite" | "character">(
    "sprite",
  );

  const mainPanel = (() => {
    if (editMode === "sprite") {
      return <SpriteMode />;
    }
    if (editMode === "character") {
      return <CharacterMode />;
    }
    return <ScreenMode />;
  })();

  return (
    <>
      <Global styles={globalStyles} />

      <Container>
        <WorkspaceGrid>
          <LeftPane>{mainPanel}</LeftPane>

          <RightPane>
            <ModeSwitcherCard>
              <ModeSwitcherLayout>
                <ModeSwitcherHeader>
                  <ModeSwitcherTitle>作業モード</ModeSwitcherTitle>
                </ModeSwitcherHeader>
                <SegmentedControl>
                  <SegmentedButton
                    active={editMode === "sprite"}
                    onClick={() => setEditMode("sprite")}
                  >
                    スプライト編集
                  </SegmentedButton>
                  <SegmentedButton
                    active={editMode === "character"}
                    onClick={() => setEditMode("character")}
                  >
                    キャラクター編集
                  </SegmentedButton>
                  <SegmentedButton
                    active={editMode === "screen"}
                    onClick={() => setEditMode("screen")}
                  >
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
