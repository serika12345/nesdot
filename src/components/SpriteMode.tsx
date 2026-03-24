import React, { useState } from "react";
import { confirm as tauriConfirm } from "@tauri-apps/plugin-dialog";
import {
    Badge,
    CanvasViewport,
    CollapseToggle,
    DetailKey,
    DetailList,
    DetailRow,
    DetailValue,
    Divider,
    Field,
    FieldGrid,
    FieldLabel,
    HelperText,
    MetricCard,
    MetricGrid,
    MetricLabel,
    MetricValue,
    NumberInput,
    Panel,
    PanelDescription,
    PanelHeader,
    PanelHeaderRow,
    PanelTitle,
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
    SpriteTileND,
    useProjectState,
} from "../store/projectState";
import { makeTile, resizeTileND } from "../tiles/utils";
import { ProjectActions } from "./ProjectActions";
import { SlotButton } from "./PalettePicker.styles";
import { Tool } from "./hooks/useSpriteCanvas";
import { SpriteCanvas } from "./SpriteCanvas";
import { ChevronIcon } from "./ui/Icons";

function makeEmptyTile(height: 8 | 16, paletteIndex: PaletteIndex): SpriteTile {
    return makeTile(height, 0, paletteIndex);
}

export const SpriteMode: React.FC = () => {
    const [tool, setTool] = useState<Tool>("pen");
    const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false);
    const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
    const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);
    const [activeSprite, setActiveSprite] = useState<number>(0);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
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
            sprites: screen.sprites.map((s) => (s.spriteIndex === index ? { ...s, ...t } : s)),
        };
        useProjectState.setState({ screen: newScreen });
    };

    const handlePaletteClick = (slot: number) => {
        setActiveSlot(slot as ColorIndexOfPalette);
    };

    const setHeight = (nextH: 8 | 16) => {
        if (Number.isNaN(nextH) || nextH < 8 || nextH % 8 !== 0) return;
        setTile(resizeTileND(activeTile as SpriteTileND, activeTile.width, nextH, { anchor: "top-left", fill: 0 }), activeSprite);
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
        setActivePalette(i as PaletteIndex);
        const newTile = { ...activeTile, paletteIndex: i as PaletteIndex };
        setTile(newTile, activeSprite);
    };

    const projectState = useProjectState((s) => s);
    const { exportChr, exportPng, exportSvgSimple, exportJSON } = useExportImage();
    const { importJSON } = useImportImage();

    const handleImport = async () => {
        try {
            await importJSON((data) => {
                useProjectState.setState(data);
                const nextPalette = data.sprites[activeSprite]?.paletteIndex ?? 0;
                setActivePalette(nextPalette as PaletteIndex);
            });
        } catch (err) {
            alert("インポートに失敗しました: " + err);
        }
    };

    return (
        <SplitLayout>
            <div css={{ display: "grid", gap: 16 }}>
                <Panel>
                    <PanelHeader>
                        <PanelHeaderRow>
                            <Badge tone="accent">{isChangeOrderMode ? "Reorder Mode" : "Brush Mode"}</Badge>
                            <ProjectActions
                                actions={[
                                    { label: "CHRエクスポート", onSelect: () => exportChr(activeTile, activePalette) },
                                    { label: "PNGエクスポート", onSelect: () => exportPng(getHexArrayForSpriteTile(activeTile)) },
                                    { label: "SVGエクスポート", onSelect: () => exportSvgSimple(getHexArrayForSpriteTile(activeTile)) },
                                    { label: "保存", onSelect: () => exportJSON(projectState) },
                                ]}
                                onImport={handleImport}
                            />
                        </PanelHeaderRow>
                        <PanelTitle>スプライト編集</PanelTitle>
                        <PanelDescription>
                            スプライト番号、パレット、サイズの設定をここにまとめ、主作業面は右のキャンバスに固定しています。
                        </PanelDescription>
                    </PanelHeader>

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
                            <SelectInput value={activePalette} onChange={(e) => handlePaletteChange(e.target.value)}>
                                {palettes.map((_, i) => (
                                    <option key={i} value={i}>
                                        Palette {i}
                                    </option>
                                ))}
                            </SelectInput>
                        </Field>
                    </FieldGrid>

                    <Toolbar>
                        <ToolButton type="button" onClick={() => setHeight(8)} active={activeTile.height === 8}>
                            8×8
                        </ToolButton>
                        <ToolButton type="button" onClick={() => setHeight(16)} active={activeTile.height === 16}>
                            8×16
                        </ToolButton>
                    </Toolbar>

                    <MetricGrid>
                        <MetricCard>
                            <MetricLabel>対象</MetricLabel>
                            <MetricValue>#{activeSprite}</MetricValue>
                        </MetricCard>
                        <MetricCard>
                            <MetricLabel>サイズ</MetricLabel>
                            <MetricValue>
                                {activeTile.width}×{activeTile.height}
                            </MetricValue>
                        </MetricCard>
                        <MetricCard>
                            <MetricLabel>現在色</MetricLabel>
                            <MetricValue>slot {activeSlot}</MetricValue>
                        </MetricCard>
                    </MetricGrid>

                    <DetailList>
                        <DetailRow>
                            <DetailKey>表示パレット</DetailKey>
                            <DetailValue>Palette {activePalette}</DetailValue>
                        </DetailRow>
                        <DetailRow>
                            <DetailKey>描画モード</DetailKey>
                            <DetailValue>{isChangeOrderMode ? "8×8 ブロックをドラッグ" : tool === "pen" ? "ペン" : "消しゴム"}</DetailValue>
                        </DetailRow>
                    </DetailList>
                </Panel>

                <Panel>
                    <PanelHeader>
                        <PanelHeaderRow>
                            <Badge tone="neutral">Palette Slots</Badge>
                            <CollapseToggle type="button" open={isPaletteOpen} onClick={() => setIsPaletteOpen((prev) => !prev)}>
                                {isPaletteOpen ? "閉じる" : "開く"}
                                <ChevronIcon open={isPaletteOpen} />
                            </CollapseToggle>
                        </PanelHeaderRow>
                        <PanelTitle>現在のスロット</PanelTitle>
                        <PanelDescription>Slot 0 は透明扱いです。必要なときだけ開いて選択します。</PanelDescription>
                    </PanelHeader>

                    {isPaletteOpen ? (
                        <>
                            <div
                                css={{
                                    position: "relative",
                                    zIndex: 1,
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                    gap: 12,
                                }}
                            >
                                {palettes[activePalette].map((idx, j) => (
                                    <div
                                        key={j}
                                        css={{
                                            display: "grid",
                                            justifyItems: "center",
                                            gap: 8,
                                            padding: "12px 8px",
                                            borderRadius: 18,
                                            background: activeSlot === j ? "rgba(15, 118, 110, 0.1)" : "rgba(248, 250, 252, 0.76)",
                                            border:
                                                activeSlot === j
                                                    ? "1px solid rgba(15, 118, 110, 0.16)"
                                                    : "1px solid rgba(148, 163, 184, 0.14)",
                                        }}
                                    >
                                        <SlotButton
                                            onClick={() => handlePaletteClick(j)}
                                            title={j === 0 ? "Slot 0: Transparent" : `Slot ${j}`}
                                            active={activeSlot === j}
                                            transparent={j === 0}
                                            bg={j === 0 ? undefined : NES_PALETTE_HEX[idx]}
                                        />
                                        <div
                                            css={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                color: "var(--ink-soft)",
                                            }}
                                        >
                                            slot{j}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Divider />
                        </>
                    ) : null}

                    <DetailList>
                        <DetailRow>
                            <DetailKey>現在色</DetailKey>
                            <DetailValue>#{palettes[activePalette][activeSlot].toString(16).padStart(2, "0").toUpperCase()}</DetailValue>
                        </DetailRow>
                    </DetailList>
                </Panel>
            </div>

            <Panel>
                <PanelHeader>
                    <PanelHeaderRow>
                        <div css={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Badge tone="neutral">Canvas</Badge>
                            <Badge tone="accent">Always On</Badge>
                            <Badge tone={isChangeOrderMode ? "accent" : "neutral"}>Tools</Badge>
                        </div>
                        <CollapseToggle type="button" open={isToolsOpen} onClick={() => setIsToolsOpen((prev) => !prev)}>
                            {isToolsOpen ? "ツールを閉じる" : "ツールを開く"}
                            <ChevronIcon open={isToolsOpen} />
                        </CollapseToggle>
                    </PanelHeaderRow>
                    <PanelTitle>Sprite Canvas</PanelTitle>
                    <PanelDescription>主作業面は右に固定し、左の各操作パネルだけを必要時に開く構造にしています。</PanelDescription>
                </PanelHeader>

                {isToolsOpen ? (
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
                        }}
                    >
                        <Toolbar>
                            <ToolButton type="button" onClick={() => setTool("pen")} active={tool === "pen"} disabled={isChangeOrderMode}>
                                ペン
                            </ToolButton>
                            <ToolButton
                                type="button"
                                onClick={() => setTool("eraser")}
                                active={tool === "eraser"}
                                disabled={isChangeOrderMode}
                            >
                                消しゴム
                            </ToolButton>
                            <ToolButton
                                type="button"
                                disabled={isChangeOrderMode}
                                onClick={async () => {
                                    const message = "本当にクリアしますか？";
                                    const shouldClear = await tauriConfirm(message, {
                                        title: "スプライトをクリア",
                                        okLabel: "クリア",
                                        cancelLabel: "キャンセル",
                                    }).catch(() => window.confirm(message));

                                    if (shouldClear) {
                                        setTile(makeEmptyTile(activeTile.height, activeTile.paletteIndex), activeSprite);
                                    }
                                }}
                            >
                                クリア
                            </ToolButton>
                            <ToolButton
                                type="button"
                                active={isChangeOrderMode}
                                tone={isChangeOrderMode ? "primary" : "neutral"}
                                onClick={() => setIsChangeOrderMode((prev) => !prev)}
                            >
                                {isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
                            </ToolButton>
                        </Toolbar>

                        <HelperText>
                            並べ替えモード中は描画ツールを停止し、キャンバス上で 8×8 ブロックのドラッグだけを有効にします。
                        </HelperText>
                    </div>
                ) : (
                    <HelperText>{isChangeOrderMode ? "並べ替えモードが有効です。" : "ツールはキャンバス上部に格納されています。"}</HelperText>
                )}

                <CanvasViewport css={{ minHeight: 520, placeItems: "center" }}>
                    <SpriteCanvas
                        isChangeOrderMode={isChangeOrderMode}
                        target={activeSprite}
                        scale={24}
                        showGrid={true}
                        tool={tool}
                        currentSelectPalette={activePalette as PaletteIndex}
                        activeColorIndex={activeSlot as ColorIndexOfPalette}
                        onChange={setTile}
                    />
                </CanvasViewport>

                <HelperText>
                    左クリックで描画します。並べ替えモードでは 8×8 ブロック単位でドラッグし、同じスプライト内の配置を入れ替えます。
                </HelperText>
            </Panel>
        </SplitLayout>
    );
};
