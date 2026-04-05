import { GlobalStyles, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import React, { useState } from "react";
import {
  Container,
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
  WorkspaceGrid,
} from "./App.styles";
import { CharacterMode } from "./components/characterMode/CharacterMode";
import { PalettePicker } from "./components/common/PalettePicker";
import { ScreenMode } from "./components/screenMode/ScreenMode";
import { SpriteMode } from "./components/spriteMode/SpriteMode";
import { getAppGlobalStyles } from "./theme";

type EditMode = "screen" | "sprite" | "character";

const SegmentedControl = styled(ToggleButtonGroup)({
  width: "100%",
  padding: "0.375rem",
  borderRadius: "1.125rem",
  background: "rgba(15, 23, 42, 0.05)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  "& .MuiToggleButtonGroup-grouped": {
    flex: 1,
    margin: 0,
    border: 0,
    borderRadius: "0.75rem",
  },
});

const SegmentedButton = styled(ToggleButton)({
  border: 0,
  borderRadius: "0.75rem",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  fontWeight: 700,
  letterSpacing: "0.01em",
  textTransform: "none",
  color: "var(--ink-strong)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
  borderColor: "transparent",
  boxShadow: "0 0.625rem 1.25rem rgba(15, 23, 42, 0.08)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
  "&:hover": {
    transform: "translateY(-0.0625rem)",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))",
  },
  "&.Mui-selected": {
    color: "var(--accent-contrast)",
    background:
      "linear-gradient(135deg, var(--accent-solid) 0%, var(--accent-emphasis) 100%)",
    border: "0.0625rem solid var(--accent-border-strong)",
    boxShadow: "0 0.875rem 1.625rem rgba(15, 118, 110, 0.22)",
  },
  "&.Mui-selected:hover": {
    background:
      "linear-gradient(135deg, var(--accent-solid) 0%, var(--accent-emphasis) 100%)",
  },
});

const isEditMode = (value: unknown): value is EditMode =>
  value === "sprite" || value === "character" || value === "screen";

/**
 * アプリ全体の編集モード切り替えと共通レイアウトを描画します。
 * 各モード画面と共有パレットを束ね、最上位の画面構成責務だけを持つコンポーネントです。
 */
export const App: React.FC = () => {
  const [editMode, setEditMode] = useState<EditMode>("sprite");

  const mainPanel = (() => {
    if (editMode === "sprite") {
      return <SpriteMode />;
    }
    if (editMode === "character") {
      return <CharacterMode />;
    }
    return <ScreenMode />;
  })();

  const handleEditModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextEditMode: unknown,
  ): void => {
    if (isEditMode(nextEditMode)) {
      setEditMode(nextEditMode);
    }
  };

  return (
    <>
      <GlobalStyles styles={getAppGlobalStyles} />

      <Container>
        <WorkspaceGrid>
          <LeftPane>{mainPanel}</LeftPane>

          <RightPane>
            <ModeSwitcherCard>
              <ModeSwitcherLayout>
                <ModeSwitcherHeader>
                  <ModeSwitcherTitle>作業モード</ModeSwitcherTitle>
                </ModeSwitcherHeader>
                <SegmentedControl
                  exclusive
                  fullWidth
                  value={editMode}
                  onChange={handleEditModeChange}
                >
                  <SegmentedButton value="sprite" aria-label="スプライト編集">
                    スプライト編集
                  </SegmentedButton>
                  <SegmentedButton
                    value="character"
                    aria-label="キャラクター編集"
                  >
                    キャラクター編集
                  </SegmentedButton>
                  <SegmentedButton value="screen" aria-label="画面配置">
                    画面配置
                  </SegmentedButton>
                </SegmentedControl>
              </ModeSwitcherLayout>
            </ModeSwitcherCard>

            <Panel flex={1} minHeight={0}>
              <PanelHeader>
                <PanelTitle>NES パレット</PanelTitle>
              </PanelHeader>
              <ScrollArea flex={1} minHeight={0} pr="0.25rem">
                <PalettePicker />
              </ScrollArea>
            </Panel>
          </RightPane>
        </WorkspaceGrid>
      </Container>
    </>
  );
};
