import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { MenuItem, OutlinedInput, Select, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useState } from "react";
import {
  ColorIndexOfPalette,
  getHexArrayForSpriteTile,
  PaletteIndex,
  ProjectSpriteSize,
  SpriteTile,
  useProjectState,
} from "../../application/state/projectStore";
import { NES_PALETTE_HEX } from "../../domain/nes/palette";
import { mergeScreenIntoNesOam } from "../../domain/screen/oamSync";
import { makeTile } from "../../domain/tiles/utils";
import { Tool } from "../../infrastructure/browser/canvas/useSpriteCanvas";
import useExportImage from "../../infrastructure/browser/useExportImage";
import useImportImage from "../../infrastructure/browser/useImportImage";
import { getArrayItem } from "../../shared/arrayAccess";
import {
  Badge,
  CanvasViewport,
  CollapseToggle,
  Field,
  FieldLabel,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollArea,
  SplitLayout,
  Toolbar,
  ToolButton,
} from "../App.styles";
import { SlotButton, SlotGroup, SlotLabel } from "./PalettePicker.styles";
import { ProjectActions } from "./ProjectActions";
import { SpriteCanvas } from "./SpriteCanvas";

function makeEmptyTile(
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile {
  return makeTile(height, paletteIndex, 0);
}

function toPaletteIndex(index: number): PaletteIndex | false {
  if (index === 0 || index === 1 || index === 2 || index === 3) {
    return index;
  }
  return false;
}

const SpriteNumberInput = styled(OutlinedInput)({
  width: "100%",
  borderRadius: "1rem",
  background: "var(--surface-quiet)",
  color: "var(--ink-strong)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.85)",
  "& .MuiOutlinedInput-input": {
    padding: "0.8125rem 0.875rem",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  "&.Mui-focused": {
    boxShadow:
      "0 0 0 0.25rem rgba(15, 118, 110, 0.1), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.85)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.4)",
  },
});

const SpritePaletteSelect = styled(Select)({
  width: "100%",
  borderRadius: "1rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92))",
  color: "var(--ink-strong)",
  "& .MuiSelect-select": {
    padding: "0.8125rem 2.5rem 0.8125rem 0.875rem",
    borderRadius: "1rem",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(15, 118, 110, 0.4)",
  },
  "& .MuiSelect-icon": {
    right: "0.875rem",
    color: "var(--ink-soft)",
  },
});

const ActiveSlotCard = styled(Stack)({
  position: "relative",
  zIndex: 1,
  padding: "0.875rem",
  borderRadius: "1.25rem",
  background: "var(--surface-muted)",
  border: "0.0625rem solid var(--line-soft)",
  flexShrink: 0,
});

const ToolPanel = styled(Stack)({
  pointerEvents: "auto",
  padding: "0.75rem",
  width: "8.5rem",
  borderRadius: "1.125rem",
  background: "rgba(248, 250, 252, 0.84)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 1.125rem 2.125rem rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(0.875rem)",
});

const ToolPanelPositionRoot = styled("div")({
  pointerEvents: "none",
});

const SpriteToolButton = styled(ToolButton)({
  width: "100%",
  justifyContent: "center",
  padding: "0.625rem 0.875rem",
});

const ToolPanelChevron = styled(ExpandMoreRoundedIcon, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ open }) => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
}));

export const SpriteMode: React.FC = () => {
  const [tool, setTool] = useState<Tool>("pen");
  const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false);
  const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
  const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);
  const [activeSprite, setActiveSprite] = useState<number>(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const projectSpriteSize = useProjectState((s) => s.spriteSize);
  const activeTile = useProjectState((s) =>
    pipe(
      getArrayItem(s.sprites, activeSprite),
      O.getOrElse(() => makeEmptyTile(projectSpriteSize, activePalette)),
    ),
  );
  const palettes = useProjectState((s) => s.nes.spritePalettes);
  const sprites = useProjectState((s) => s.sprites);
  const screen = useProjectState((s) => s.screen);

  const setTile = (t: SpriteTile, index: number) => {
    const newSprites = sprites.map((sprite, spriteIndex) =>
      spriteIndex === index ? t : sprite,
    );
    useProjectState.setState({ sprites: newSprites });

    const newScreen = {
      ...screen,
      sprites: screen.sprites.map((s) =>
        s.spriteIndex === index ? { ...s, ...t } : s,
      ),
    };
    const state = useProjectState.getState();
    useProjectState.setState({
      screen: newScreen,
      nes: mergeScreenIntoNesOam(state.nes, newScreen),
    });
  };

  const handlePaletteClick = (slot: number) => {
    if (slot !== 0 && slot !== 1 && slot !== 2 && slot !== 3) {
      return;
    }
    setActiveSlot(slot);
  };

  const handleSpriteChange = (index: string) => {
    const i = Number.parseInt(index, 10);
    if (i < 0 || i >= 64 || Number.isNaN(i)) return;
    setActiveSprite(i);
    const targetSpriteOption = getArrayItem(sprites, i);
    if (O.isNone(targetSpriteOption)) {
      return;
    }
    setActivePalette(targetSpriteOption.value.paletteIndex);
  };

  const handlePaletteChange = (index: string) => {
    const i = Number.parseInt(index, 10);
    const paletteIndex = toPaletteIndex(i);
    if (paletteIndex === false) {
      return;
    }
    setActivePalette(paletteIndex);
    const newTile: SpriteTile = { ...activeTile, paletteIndex };
    setTile(newTile, activeSprite);
  };

  const projectState = useProjectState((s) => s);
  const { exportChr, exportPng, exportSvgSimple, exportJSON } =
    useExportImage();
  const { importJSON } = useImportImage();

  const handleImport = async () => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        const nextPalette = pipe(
          getArrayItem(data.sprites, activeSprite),
          O.match(
            (): PaletteIndex => 0,
            (sprite): PaletteIndex => sprite.paletteIndex,
          ),
        );
        setActivePalette(nextPalette);
      });
    } catch (err) {
      alert("インポートに失敗しました: " + err);
    }
  };

  const handleClearSprite = async () => {
    const message = "本当にクリアしますか？";
    const shouldClear = await tauriConfirm(message, {
      title: "スプライトをクリア",
      okLabel: "クリア",
      cancelLabel: "キャンセル",
    }).catch(() => window.confirm(message));

    if (shouldClear === true) {
      setTile(
        makeEmptyTile(activeTile.height, activeTile.paletteIndex),
        activeSprite,
      );
    }
  };

  return (
    <SplitLayout>
      <Panel minHeight={0}>
        <PanelHeader>
          <PanelTitle>スプライト編集</PanelTitle>
        </PanelHeader>

        <Stack
          component={ScrollArea}
          spacing="0.875rem"
          alignContent="start"
          flex={1}
          minHeight={0}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing="0.75rem"
            useFlexGap
            alignItems="stretch"
          >
            <Field flex={1}>
              <FieldLabel>スプライト番号</FieldLabel>
              <SpriteNumberInput
                type="number"
                value={activeSprite}
                inputProps={{
                  "aria-label": "スプライト番号",
                  min: 0,
                  max: 63,
                  step: 1,
                }}
                onChange={(e) => handleSpriteChange(e.target.value)}
              />
            </Field>
            <Field flex={1}>
              <FieldLabel>パレット</FieldLabel>
              <SpritePaletteSelect
                variant="outlined"
                value={activePalette}
                inputProps={{
                  "aria-label": "パレット",
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (typeof value !== "string" && typeof value !== "number") {
                    return;
                  }
                  handlePaletteChange(String(value));
                }}
              >
                {palettes.map((_, i) => (
                  <MenuItem key={i} value={i}>
                    パレット {i}
                  </MenuItem>
                ))}
              </SpritePaletteSelect>
            </Field>
          </Stack>

          <Toolbar>
            <Badge tone="accent">
              {projectSpriteSize === 8
                ? "Project Sprite Size 8×8"
                : "Project Sprite Size 8×16"}
            </Badge>
          </Toolbar>
        </Stack>
      </Panel>

      <Panel flex={1} minHeight={0}>
        <PanelHeader>
          <PanelHeaderRow>
            <PanelTitle>スプライトキャンバス</PanelTitle>
            <ProjectActions
              actions={[
                {
                  label: "CHRエクスポート",
                  onSelect: () => exportChr(activeTile, activePalette),
                },
                {
                  label: "PNGエクスポート",
                  onSelect: () =>
                    exportPng(getHexArrayForSpriteTile(activeTile)),
                },
                {
                  label: "SVGエクスポート",
                  onSelect: () =>
                    exportSvgSimple(getHexArrayForSpriteTile(activeTile)),
                },
                { label: "保存", onSelect: () => exportJSON(projectState) },
              ]}
              onImport={handleImport}
            />
          </PanelHeaderRow>
        </PanelHeader>

        <ActiveSlotCard spacing="0.75rem">
          <PanelHeaderRow>
            <FieldLabel>現在のスロット</FieldLabel>
            <Badge tone="accent">パレット {activePalette}</Badge>
          </PanelHeaderRow>

          <Stack direction="row" spacing="0.75rem" useFlexGap flexWrap="wrap">
            {palettes[activePalette].map((idx, j) => (
              <SlotGroup key={j} active={activeSlot === j} flex="1 1 4.5rem">
                <SlotButton
                  onClick={() => handlePaletteClick(j)}
                  title={j === 0 ? "スロット 0: 透明" : `スロット ${j}`}
                  active={activeSlot === j}
                  transparent={j === 0}
                  {...(j !== 0 ? { bg: NES_PALETTE_HEX[idx] } : {})}
                />
                <SlotLabel>スロット{j}</SlotLabel>
              </SlotGroup>
            ))}
          </Stack>
        </ActiveSlotCard>

        <CanvasViewport flex={1} minHeight={0}>
          <Stack
            position="absolute"
            top="1.125rem"
            left="1.125rem"
            zIndex={4}
            spacing={0}
          >
            <CollapseToggle
              type="button"
              open={isToolsOpen}
              onClick={() => setIsToolsOpen((prev) => !prev)}
            >
              {isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
              <ToolPanelChevron open={isToolsOpen} />
            </CollapseToggle>
          </Stack>

          {isToolsOpen && (
            <Stack
              component={ToolPanelPositionRoot}
              position="absolute"
              top="4.25rem"
              left="1.125rem"
              zIndex={3}
              bottom="1.125rem"
              alignItems="flex-start"
            >
              <ToolPanel spacing="0.625rem">
                <SpriteToolButton
                  type="button"
                  onClick={() => setTool("pen")}
                  active={tool === "pen"}
                  disabled={isChangeOrderMode}
                >
                  ペン
                </SpriteToolButton>
                <SpriteToolButton
                  type="button"
                  onClick={() => setTool("eraser")}
                  active={tool === "eraser"}
                  disabled={isChangeOrderMode}
                >
                  消しゴム
                </SpriteToolButton>
                <SpriteToolButton
                  type="button"
                  disabled={isChangeOrderMode}
                  onClick={handleClearSprite}
                >
                  クリア
                </SpriteToolButton>
                <SpriteToolButton
                  type="button"
                  active={isChangeOrderMode}
                  tone={isChangeOrderMode ? "primary" : "neutral"}
                  onClick={() => setIsChangeOrderMode((prev) => !prev)}
                >
                  {isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
                </SpriteToolButton>
              </ToolPanel>
            </Stack>
          )}

          <Stack
            minWidth="100%"
            minHeight="100%"
            alignItems="center"
            justifyContent="center"
          >
            <SpriteCanvas
              isChangeOrderMode={isChangeOrderMode}
              target={activeSprite}
              scale={24}
              showGrid={true}
              tool={tool}
              currentSelectPalette={activePalette}
              activeColorIndex={activeSlot}
              onChange={setTile}
            />
          </Stack>
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};
