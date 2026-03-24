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
} from "../App.styles";
import useExportImage from "../hooks/useExportImage";
import useImportImage from "../hooks/useImportImage";
import { getHexArrayForScreen, SpriteInScreen, useProjectState } from "../store/projectState";
import { ScreenCanvas } from "./ScreenCanvas";

export const ScreenMode: React.FC = () => {
    const [spriteNumber, setSpriteNumber] = useState(0);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<number | null>(() => {
        if (useProjectState.getState().screen.sprites.length > 0) return 0;
        return null;
    });
    const screen = useProjectState((s) => s.screen);
    const sprites = useProjectState((s) => s.sprites);
    const spritesOnScreen = useProjectState((s) => s.screen.sprites);
    const projectState = useProjectState((s) => s);
    const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
    const { importJSON } = useImportImage();

    const SCREEN_HEIGHT = screen.height;
    const MAX_SPRITES = 64;
    const MAX_PER_SCANLINE = 8;

    type ScanReport = { ok: true } | { ok: false; errors: string[] };

    const scan = (checkee = useProjectState.getState().screen): ScanReport => {
        const errors: string[] = [];
        const list = checkee.sprites;

        if (list.length > MAX_SPRITES) {
            errors.push(`スプライト総数が上限(${MAX_SPRITES})を超えています: ${list.length}`);
        }

        const scanlineCount = new Array<number>(SCREEN_HEIGHT).fill(0);
        list.forEach((sp) => {
            const y0 = Math.max(0, sp.y);
            const y1 = Math.min(SCREEN_HEIGHT - 1, sp.y + sp.height - 1);
            for (let yy = y0; yy <= y1; yy++) {
                scanlineCount[yy]++;
            }
        });

        const violLines: number[] = [];
        for (let yy = 0; yy < SCREEN_HEIGHT; yy++) {
            if (scanlineCount[yy] > MAX_PER_SCANLINE) violLines.push(yy);
        }

        if (violLines.length) {
            const sample = violLines.slice(0, 10).join(", ");
            errors.push(`同一スキャンライン上のスプライト数が上限(${MAX_PER_SCANLINE})を超えています。y=${sample}`);
        }

        return errors.length ? { ok: false, errors } : { ok: true };
    };

    const handleImport = async () => {
        try {
            await importJSON((data) => {
                useProjectState.setState(data);
                setSelectedSpriteIndex(data.screen.sprites.length > 0 ? 0 : null);

                const result = scan(data.screen);
                if (result.ok === false) {
                    alert("インポートしたデータに制約違反があります:\n" + result.errors.join("\n"));
                }
            });
        } catch (err) {
            alert("インポートに失敗しました: " + err);
        }
    };

    const handleAddSprite = () => {
        const spriteTile = sprites[spriteNumber];
        if (!spriteTile) {
            alert("指定されたスプライト番号のスプライトが存在しません");
            return;
        }

        const candidate: SpriteInScreen = {
            ...spriteTile,
            x,
            y,
            spriteIndex: spriteNumber,
        };
        const newScreen = {
            ...screen,
            sprites: [...screen.sprites, candidate],
        };

        const report = scan(newScreen);
        if (report.ok === false) {
            alert("スプライトの追加に失敗しました。制約違反:\n" + report.errors.join("\n"));
            return;
        }

        useProjectState.setState({ screen: newScreen });
        if (selectedSpriteIndex == null) {
            setSelectedSpriteIndex(newScreen.sprites.length - 1);
        }
        alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
    };

    const activeSprite = selectedSpriteIndex !== null ? spritesOnScreen[selectedSpriteIndex] : null;
    const scanReport = scan(screen);

    return (
        <>
            <Panel>
                <PanelHeader>
                    <Badge tone={scanReport.ok ? "accent" : "danger"}>{scanReport.ok ? "Constraint OK" : "Needs Attention"}</Badge>
                    <PanelTitle>スプライト配置</PanelTitle>
                    <PanelDescription>
                        スプライト番号と座標を指定して画面へ配置します。NES 制約は追加時と移動時の両方で保持されます。
                    </PanelDescription>
                </PanelHeader>

                <FieldGrid css={{ gridTemplateColumns: "repeat(3, minmax(140px, 1fr)) 220px" }}>
                    <Field>
                        <FieldLabel>スプライト番号</FieldLabel>
                        <NumberInput
                            type="number"
                            min={0}
                            max={64}
                            value={spriteNumber}
                            onChange={(e) => setSpriteNumber(Number(e.target.value))}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>X 座標</FieldLabel>
                        <NumberInput type="number" min={0} max={256} value={x} onChange={(e) => setX(Number(e.target.value))} />
                    </Field>
                    <Field>
                        <FieldLabel>Y 座標</FieldLabel>
                        <NumberInput type="number" min={0} max={240} value={y} onChange={(e) => setY(Number(e.target.value))} />
                    </Field>

                    <ActionButton tone="primary" onClick={handleAddSprite}>
                        スプライトを追加
                    </ActionButton>
                </FieldGrid>

                <MetricGrid>
                    <MetricCard>
                        <MetricLabel>配置中</MetricLabel>
                        <MetricValue>{spritesOnScreen.length}/64</MetricValue>
                    </MetricCard>
                    <MetricCard>
                        <MetricLabel>画面サイズ</MetricLabel>
                        <MetricValue>
                            {screen.width}×{screen.height}
                        </MetricValue>
                    </MetricCard>
                    <MetricCard>
                        <MetricLabel>制約</MetricLabel>
                        <MetricValue>1ライン最大 8</MetricValue>
                    </MetricCard>
                </MetricGrid>

                {scanReport.ok === false && (
                    <div
                        css={{
                            position: "relative",
                            zIndex: 1,
                            display: "grid",
                            gap: 8,
                            padding: 16,
                            borderRadius: 20,
                            background: "rgba(190, 24, 93, 0.08)",
                            border: "1px solid rgba(190, 24, 93, 0.16)",
                            color: "#9f1239",
                            fontSize: 13,
                            lineHeight: 1.6,
                        }}
                    >
                        {scanReport.errors.map((error) => (
                            <div key={error}>{error}</div>
                        ))}
                    </div>
                )}
            </Panel>

            <Panel>
                <PanelHeader>
                    <Badge tone="neutral">Selection</Badge>
                    <PanelTitle>配置済みスプライト</PanelTitle>
                    <PanelDescription>一覧から選ぶと現在のスプライト位置とサイズをその場で編集できます。</PanelDescription>
                </PanelHeader>

                <Field>
                    <FieldLabel>スプライト一覧</FieldLabel>
                    <SelectInput
                        onChange={(e) => setSelectedSpriteIndex(e.target.value === "" ? null : Number(e.target.value))}
                        value={selectedSpriteIndex ?? ""}
                    >
                        {spritesOnScreen.length === 0 && <option value="">スプライトが配置されていません</option>}
                        {spritesOnScreen.map((sprite, index) => (
                            <option key={index} value={index}>
                                {`#${index} spriteIndex:${sprite.spriteIndex} ${sprite.width}x${sprite.height} @ ${sprite.x},${sprite.y}`}
                            </option>
                        ))}
                    </SelectInput>
                </Field>

                {activeSprite && (
                    <>
                        <DetailList>
                            <DetailRow>
                                <DetailKey>選択中の番号</DetailKey>
                                <DetailValue>#{selectedSpriteIndex}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailKey>元スプライト</DetailKey>
                                <DetailValue>spriteIndex {activeSprite.spriteIndex}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailKey>サイズ</DetailKey>
                                <DetailValue>
                                    {activeSprite.width}×{activeSprite.height}
                                </DetailValue>
                            </DetailRow>
                        </DetailList>

                        <FieldGrid css={{ gridTemplateColumns: "repeat(2, minmax(180px, 220px)) auto" }}>
                            <Field>
                                <FieldLabel>Position X</FieldLabel>
                                <NumberInput
                                    type="number"
                                    value={activeSprite.x}
                                    onChange={(e) => {
                                        const newX = Number(e.target.value);
                                        const newSprites = spritesOnScreen.map((s, i) =>
                                            i === selectedSpriteIndex ? { ...s, x: newX } : s
                                        );
                                        const newScreen = { ...screen, sprites: newSprites };
                                        const report = scan(newScreen);
                                        if (report.ok === false) {
                                            alert("位置の更新に失敗しました。制約違反:\n" + report.errors.join("\n"));
                                            return;
                                        }
                                        useProjectState.setState({ screen: newScreen });
                                    }}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Position Y</FieldLabel>
                                <NumberInput
                                    type="number"
                                    value={activeSprite.y}
                                    onChange={(e) => {
                                        const newY = Number(e.target.value);
                                        const newSprites = spritesOnScreen.map((s, i) =>
                                            i === selectedSpriteIndex ? { ...s, y: newY } : s
                                        );
                                        const newScreen = { ...screen, sprites: newSprites };
                                        const report = scan(newScreen);
                                        if (report.ok === false) {
                                            alert("位置の更新に失敗しました。制約違反:\n" + report.errors.join("\n"));
                                            return;
                                        }
                                        useProjectState.setState({ screen: newScreen });
                                    }}
                                />
                            </Field>

                            <ActionButton
                                tone="danger"
                                onClick={() => {
                                    const newSprites = spritesOnScreen.filter((_, i) => i !== selectedSpriteIndex);
                                    const newScreen = { ...screen, sprites: newSprites };
                                    const report = scan(newScreen);
                                    if (report.ok === false) {
                                        alert("削除後の状態で制約違反が検出されました:\n" + report.errors.join("\n"));
                                    }
                                    useProjectState.setState({ screen: newScreen });
                                    setSelectedSpriteIndex(null);
                                }}
                            >
                                このスプライトを削除
                            </ActionButton>
                        </FieldGrid>
                    </>
                )}

                {!activeSprite && (
                    <HelperText>スプライトを追加するか、一覧から対象を選択してください。</HelperText>
                )}
            </Panel>

            <Panel>
                <PanelHeader>
                    <Badge tone="neutral">Preview</Badge>
                    <PanelTitle>Screen Preview</PanelTitle>
                    <PanelDescription>
                        256×240 のプレビューです。表示倍率は既存どおり 5 倍のまま維持しています。
                    </PanelDescription>
                </PanelHeader>

                <CanvasViewport>
                    <ScreenCanvas scale={5} showGrid={true} />
                </CanvasViewport>
            </Panel>

            <Panel>
                <PanelHeader>
                    <Badge tone="neutral">Project I/O</Badge>
                    <PanelTitle>エクスポートと保存</PanelTitle>
                    <PanelDescription>現在の画面状態を画像または JSON として出力し、後で復元できます。</PanelDescription>
                </PanelHeader>

                <CanvasActions>
                    <ActionButton tone="primary" onClick={() => exportPng(getHexArrayForScreen(screen))}>
                        PNGエクスポート
                    </ActionButton>
                    <ActionButton onClick={() => exportSvgSimple(getHexArrayForScreen(screen))}>SVGエクスポート</ActionButton>
                    <ActionButton onClick={() => exportJSON(projectState)}>保存</ActionButton>
                    <ActionButton onClick={handleImport}>復元</ActionButton>
                </CanvasActions>
            </Panel>
        </>
    );
};
