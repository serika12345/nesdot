import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import React, { useState } from "react";
import {
  Badge,
  CanvasViewport,
  CollapseToggle,
  Field,
  FieldGrid,
  FieldLabel,
  NumberInput,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollArea,
  SelectInput,
  SplitLayout,
  Toolbar,
  ToolButton,
} from "../App.styles";
import useExportImage from "../hooks/useExportImage";
import useImportImage from "../hooks/useImportImage";
import { NES_PALETTE_HEX } from "../nes/palette";
import {
  ColorIndexOfPalette,
  getHexArrayForSpriteTile,
  PaletteIndex,
  SpriteTile,
  useProjectState,
} from "../store/projectState";
import { makeTile, resizeTileND } from "../tiles/utils";
import { Tool } from "./hooks/useSpriteCanvas";
import { SlotButton, SlotGroup, SlotLabel } from "./PalettePicker.styles";
import { ProjectActions } from "./ProjectActions";
import { SpriteCanvas } from "./SpriteCanvas";
import { ChevronIcon } from "./ui/Icons";

function makeEmptyTile(height: 8 | 16, paletteIndex: PaletteIndex): SpriteTile {
  return makeTile(height, paletteIndex, 0);
}

export const SpriteMode: React.FC = () => {
  const [tool, setTool] = useState<Tool>("pen");
  const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false);
  const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
  const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);
  const [activeSprite, setActiveSprite] = useState<number>(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const activeTile = useProjectState((s) => s.sprites[activeSprite]);
  const palettes = useProjectState((s) => s.palettes);
  const sprites = useProjectState((s) => s.sprites);
  const screen = useProjectState((s) => s.screen);

  const setTile = (t: SpriteTile, index: number) => {
    const newSprites = [...sprites];
    newSprites[index] = t;
    useProjectState.setState({ sprites: newSprites });

    const newScreen = {
      ...screen,
      sprites: screen.sprites.map((s) =>
        s.spriteIndex === index ? { ...s, ...t } : s,
      ),
    };
    useProjectState.setState({ screen: newScreen });
  };

  const handlePaletteClick = (slot: number) => {
    if (slot !== 0 && slot !== 1 && slot !== 2 && slot !== 3) {
      return;
    }
    setActiveSlot(slot);
  };

  const setHeight = (nextH: 8 | 16) => {
    if (Number.isNaN(nextH) || nextH < 8 || nextH % 8 !== 0) return;
    setTile(
      resizeTileND(activeTile, activeTile.width, nextH, {
        anchor: "top-left",
        fill: 0,
      }),
      activeSprite,
    );
  };

  const handleSpriteChange = (index: string) => {
    const i = parseInt(index);
    if (i < 0 || i >= 64 || Number.isNaN(i)) return;
    setActiveSprite(i);
    const targetSprite = sprites[i];
    setActivePalette(targetSprite.paletteIndex);
  };

  const handlePaletteChange = (index: string) => {
    const i = parseInt(index);
    if (i !== 0 && i !== 1 && i !== 2 && i !== 3) {
      return;
    }
    setActivePalette(i);
    const newTile = { ...activeTile, paletteIndex: i };
    setTile(newTile, activeSprite);
  };

  const projectState = useProjectState((s) => s);
  const { exportChr, exportPng, exportSvgSimple, exportJSON } =
    useExportImage();
  const { importJSON } = useImportImage();

  const handleImport = async () => {
    try {
      await importJSON((data) => {
        useProjectState.setState(data);
        const nextPalette = data.sprites[activeSprite]?.paletteIndex ?? 0;
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
      <Panel css={{ gridTemplateRows: "auto minmax(0, 1fr)" }}>
        <PanelHeader>
          <PanelTitle>スプライト編集</PanelTitle>
        </PanelHeader>

        <ScrollArea css={{ display: "grid", gap: 14, alignContent: "start" }}>
          <FieldGrid css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <Field>
              <FieldLabel>スプライト番号</FieldLabel>
              <NumberInput
                type="number"
                value={activeSprite}
                onChange={(e) => handleSpriteChange(e.target.value)}
                step={1}
                min={0}
                max={63}
              />
            </Field>
            <Field>
              <FieldLabel>パレット</FieldLabel>
              <SelectInput
                value={activePalette}
                onChange={(e) => handlePaletteChange(e.target.value)}
              >
                {palettes.map((_, i) => (
                  <option key={i} value={i}>
                    パレット {i}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </FieldGrid>

          <Toolbar>
            <ToolButton
              type="button"
              onClick={() => setHeight(8)}
              active={activeTile.height === 8}
            >
              8×8
            </ToolButton>
            <ToolButton
              type="button"
              onClick={() => setHeight(16)}
              active={activeTile.height === 16}
            >
              8×16
            </ToolButton>
          </Toolbar>
        </ScrollArea>
      </Panel>

      <Panel css={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

        <div
          css={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gap: 12,
            padding: 14,
            borderRadius: 20,
            background: "rgba(248, 250, 252, 0.82)",
            border: "1px solid rgba(148, 163, 184, 0.16)",
            flexShrink: 0,
          }}
        >
          <PanelHeaderRow>
            <FieldLabel>現在のスロット</FieldLabel>
            <Badge tone="accent">パレット {activePalette}</Badge>
          </PanelHeaderRow>

          <div
            css={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {palettes[activePalette].map((idx, j) => (
              <SlotGroup key={j} active={activeSlot === j}>
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
          </div>
        </div>

        <CanvasViewport css={{ flex: 1, minHeight: 0, placeItems: "center" }}>
          <div
            css={{
              position: "absolute",
              top: 18,
              left: 18,
              zIndex: 4,
            }}
          >
            <CollapseToggle
              type="button"
              open={isToolsOpen}
              onClick={() => setIsToolsOpen((prev) => !prev)}
            >
              {isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
              <ChevronIcon open={isToolsOpen} />
            </CollapseToggle>
          </div>

          {isToolsOpen && (
            <div
              css={{
                position: "absolute",
                top: 68,
                left: 18,
                zIndex: 3,
                bottom: 18,
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <div
                css={{
                  pointerEvents: "auto",
                  display: "grid",
                  gap: 10,
                  padding: 12,
                  width: 136,
                  borderRadius: 18,
                  background: "rgba(248, 250, 252, 0.84)",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.16)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div css={{ display: "grid", gap: 8 }}>
                  <ToolButton
                    type="button"
                    onClick={() => setTool("pen")}
                    active={tool === "pen"}
                    disabled={isChangeOrderMode}
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "10px 14px",
                    }}
                  >
                    ペン
                  </ToolButton>
                  <ToolButton
                    type="button"
                    onClick={() => setTool("eraser")}
                    active={tool === "eraser"}
                    disabled={isChangeOrderMode}
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "10px 14px",
                    }}
                  >
                    消しゴム
                  </ToolButton>
                  <ToolButton
                    type="button"
                    disabled={isChangeOrderMode}
                    onClick={handleClearSprite}
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "10px 14px",
                    }}
                  >
                    クリア
                  </ToolButton>
                  <ToolButton
                    type="button"
                    active={isChangeOrderMode}
                    tone={isChangeOrderMode ? "primary" : "neutral"}
                    onClick={() => setIsChangeOrderMode((prev) => !prev)}
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "10px 14px",
                    }}
                  >
                    {isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
                  </ToolButton>
                </div>
              </div>
            </div>
          )}

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
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};
