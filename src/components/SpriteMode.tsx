import React, { useState } from "react";
import {
    ActionButton,
    Badge,
    CanvasActions,
    CanvasViewport,
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
import { Tool } from "./hooks/useSpriteCanvas";
import { SlotButton } from "./PalettePicker.styles";
import { SpriteCanvas } from "./SpriteCanvas";

function makeEmptyTile(height: 8 | 16, paletteIndex: PaletteIndex): SpriteTile {
    return makeTile(height, 0, paletteIndex);
}

export const SpriteMode: React.FC = () => {
    const [tool, setTool] = useState<Tool>("pen");
    const [isChangeOrderMode, setIsChangeOrderMode] = useState<boolean>(false);
    const [activePalette, setActivePalette] = useState<PaletteIndex>(0);
    const [activeSlot, setActiveSlot] = useState<ColorIndexOfPalette>(1);
    const [activeSprite, setActiveSprite] = useState<number>(0);
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
            <div css={{ display: "grid", gap: 20 }}>
                <Panel>
                    <PanelHeader>
                        <Badge tone="accent">{isChangeOrderMode ? "Reorder Mode" : "Brush Mode"}</Badge>
                        <PanelTitle>スプライト設定</PanelTitle>
                        <PanelDescription>
                            編集対象のスプライト、サイズ、パレットを切り替えます。現在のデータ構造はそのまま使っています。
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
                        <ToolButton onClick={() => setHeight(8)} active={activeTile.height === 8}>
                            8×8
                        </ToolButton>
                        <ToolButton onClick={() => setHeight(16)} active={activeTile.height === 16}>
                            8×16
                        </ToolButton>
                    </Toolbar>

                    <MetricGrid>
                        <MetricCard>
                            <MetricLabel>キャンバス</MetricLabel>
                            <MetricValue>
                                {activeTile.width}×{activeTile.height}
                            </MetricValue>
                        </MetricCard>
                        <MetricCard>
                            <MetricLabel>アクティブ</MetricLabel>
                            <MetricValue>slot {activeSlot}</MetricValue>
                        </MetricCard>
                        <MetricCard>
                            <MetricLabel>表示パレット</MetricLabel>
                            <MetricValue>Palette {activePalette}</MetricValue>
                        </MetricCard>
                    </MetricGrid>
                </Panel>

                <Panel>
                    <PanelHeader>
                        <Badge tone={isChangeOrderMode ? "accent" : "neutral"}>Tools</Badge>
                        <PanelTitle>ツールと操作</PanelTitle>
                        <PanelDescription>
                            ペンと消しゴムで描画し、必要に応じて 8×8 ブロックの並べ替えモードに切り替えます。
                        </PanelDescription>
                    </PanelHeader>

                    <Toolbar>
                        <ToolButton onClick={() => setTool("pen")} active={tool === "pen"} disabled={isChangeOrderMode}>
                            ペン
                        </ToolButton>
                        <ToolButton onClick={() => setTool("eraser")} active={tool === "eraser"} disabled={isChangeOrderMode}>
                            消しゴム
                        </ToolButton>
                        <ToolButton
                            disabled={isChangeOrderMode}
                            onClick={() => {
                                if (confirm("本当にクリアしますか？")) {
                                    setTile(makeEmptyTile(activeTile.height, activeTile.paletteIndex), activeSprite);
                                }
                            }}
                        >
                            クリア
                        </ToolButton>
                        <ToolButton
                            active={isChangeOrderMode}
                            tone={isChangeOrderMode ? "primary" : "neutral"}
                            onClick={() => setIsChangeOrderMode((prev) => !prev)}
                        >
                            {isChangeOrderMode ? "並べ替え終了" : "並べ替え"}
                        </ToolButton>
                    </Toolbar>

                    <DetailList>
                        <DetailRow>
                            <DetailKey>描画モード</DetailKey>
                            <DetailValue>{isChangeOrderMode ? "8×8 ブロックをドラッグ" : tool === "pen" ? "ペン" : "消しゴム"}</DetailValue>
                        </DetailRow>
                        <DetailRow>
                            <DetailKey>エディタ倍率</DetailKey>
                            <DetailValue>24x</DetailValue>
                        </DetailRow>
                    </DetailList>

                    <HelperText>
                        並べ替えモード中は描画ツールを固定停止し、キャンバス上で 8×8 単位のドラッグだけを有効にしています。
                    </HelperText>
                </Panel>

                <Panel>
                    <PanelHeader>
                        <Badge tone="neutral">Palette Slots</Badge>
                        <PanelTitle>現在のスロット</PanelTitle>
                        <PanelDescription>スプライト編集中のスロットをここで選択します。Slot 0 は透明扱いです。</PanelDescription>
                    </PanelHeader>

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

                    <DetailList>
                        <DetailRow>
                            <DetailKey>現在色</DetailKey>
                            <DetailValue>#{palettes[activePalette][activeSlot].toString(16).padStart(2, "0").toUpperCase()}</DetailValue>
                        </DetailRow>
                    </DetailList>
                </Panel>

                <Panel>
                    <PanelHeader>
                        <Badge tone="neutral">Project I/O</Badge>
                        <PanelTitle>エクスポートと保存</PanelTitle>
                        <PanelDescription>CHR と画像書き出し、JSON 保存と復元はこれまでと同じ動作のままです。</PanelDescription>
                    </PanelHeader>

                    <CanvasActions>
                        <ActionButton tone="primary" onClick={() => exportChr(activeTile, activePalette)}>
                            CHRエクスポート
                        </ActionButton>
                        <ActionButton onClick={() => exportPng(getHexArrayForSpriteTile(activeTile))}>PNGエクスポート</ActionButton>
                        <ActionButton onClick={() => exportSvgSimple(getHexArrayForSpriteTile(activeTile))}>SVGエクスポート</ActionButton>
                        <ActionButton onClick={() => exportJSON(projectState)}>保存</ActionButton>
                        <ActionButton onClick={handleImport}>復元</ActionButton>
                    </CanvasActions>
                </Panel>
            </div>

            <Panel>
                <PanelHeader>
                    <Badge tone="neutral">Canvas</Badge>
                    <PanelTitle>Sprite Canvas</PanelTitle>
                    <PanelDescription>
                        ピクセル編集と並べ替えの主作業面です。既存の描画ロジックとイベントハンドラはそのまま利用しています。
                    </PanelDescription>
                </PanelHeader>

                <CanvasViewport css={{ minHeight: 540, placeItems: "center" }}>
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
